import path from 'node:path';
import {readFile,unlink} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {configPath,readConfig,readStoredConfig,atomicWrite,profiles,saveProfile,requireCloud} from './config.js';
import {decodeWav} from './audio.js';
import {FishProvider} from './fish.js';
import {fail,resultError} from './errors.js';

const MAX_WAV=20*1024*1024;
function fields(q,allowed){if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!allowed.includes(k)))fail('SETTINGS_INPUT_INVALID','設定請求格式不正確。');}
function string(v,max,label){if(typeof v!=='string'||v.length>max||/[\x00-\x1f]/u.test(v))fail('SETTINGS_INPUT_INVALID',`${label} 格式不正確。`);return v.trim();}
const revision=c=>createHash('sha256').update(JSON.stringify(c)).digest('hex');

export class SettingsStore {
  constructor({file=configPath(),providerFactory=c=>new FishProvider(c)}={}){this.file=file;this.providerFactory=providerFactory;this.receipts=new Map();this.mutating=false;}
  async snapshot(){
    const raw=await readStoredConfig(this.file),c=await readConfig(this.file);
    return {success:true,revision:revision(raw),keyConfigured:!!c.fishApiKey,keySource:!c.fishApiKey?'none':raw.fishApiKey?'local':'environment',
      defaultProfile:raw.defaultProfile||'',defaultReferenceId:raw.defaultReferenceId||'',outputDirectory:raw.outputDirectory||'',defaultFormat:'wav',
      rightsConfirmed:raw.rightsConfirmed===true,allowPaidRequests:raw.allowPaidRequests===true,
      profiles:(await profiles(c)).map(p=>({name:p.name,reference_id:p.reference_id,state:p.state})),
      setupLocation:'DSH 設定 → 角色語音',outputLocation:raw.outputDirectory||'目前 DSH 工作區的 generated_audio 資料夾'};
  }
  async command(q){
    try{
      if(q?.action==='get'){fields(q,['action']);return await this.snapshot();}
      if(this.mutating)fail('SETTINGS_BUSY','另一項設定或聲線建立正在進行，請稍候。');
      this.mutating=true;
      try{
        switch(q?.action){
          case 'save':return await this.save(q);
          case 'stage_wav':return await this.stage(q);
          case 'discard_wav':return await this.discard(q);
          case 'create_voice':return await this.create(q);
          case 'import_reference':return await this.importReference(q);
          case 'remove_profile':return await this.removeProfile(q);
          default:fail('SETTINGS_INPUT_INVALID','未知設定操作。');
        }
      }finally{this.mutating=false;}
    }catch(e){return resultError(e);}
  }
  async save(q){
    fields(q,['action','revision','keyAction','fishApiKey','defaultProfile','defaultReferenceId','outputDirectory','defaultFormat','rightsConfirmed','allowPaidRequests']);
    const c=await readStoredConfig(this.file);
    if(q.revision!==revision(c))fail('SETTINGS_CHANGED','設定已在其他頁面變更，請重新載入再儲存。');
    if(!['keep','replace','clear'].includes(q.keyAction))fail('SETTINGS_INPUT_INVALID','請選擇保留、更新或移除 Key。');
    if(q.keyAction==='replace'){
      const key=string(q.fishApiKey,4096,'API Key');if(key.length<8)fail('SETTINGS_INPUT_INVALID','API Key 太短或空白；空欄不會刪除既有 Key。');
      c.fishApiKey=key;c.fishApiKeyDisabled=false;
    }else{
      if(q.fishApiKey!==undefined&&q.fishApiKey!=='')fail('SETTINGS_INPUT_INVALID','保留／移除 Key 時不可夾帶新的 Key。');
      if(q.keyAction==='clear'){c.fishApiKey='';c.fishApiKeyDisabled=true;}
    }
    for(const key of ['defaultProfile','defaultReferenceId','outputDirectory'])c[key]=string(q[key]??'',key==='outputDirectory'?4096:256,key);
    if(c.outputDirectory&&!path.isAbsolute(c.outputDirectory))fail('SETTINGS_INPUT_INVALID','自訂輸出目錄需為完整路徑；留空即可使用目前工作區。');
    if(c.outputDirectory.split(/[\\/]/).some(p=>p.toLowerCase()==='node_modules'))fail('SETTINGS_INPUT_INVALID','輸出不能放在 node_modules。');
    if(q.defaultFormat!=='wav')fail('FORMAT_UNAVAILABLE','目前請使用 WAV。');c.defaultFormat='wav';
    for(const key of ['rightsConfirmed','allowPaidRequests']){if(typeof q[key]!=='boolean')fail('SETTINGS_INPUT_INVALID','使用權與費用確認須由本人勾選。');c[key]=q[key];}
    await atomicWrite(this.file,JSON.stringify(c,null,2));return this.snapshot();
  }
  async stage(q){
    fields(q,['action','filename','data']);
    const filename=string(q.filename,255,'檔名');
    if(!/\.wav$/i.test(filename)||/[\\/:]/.test(filename))fail('REFERENCE_INVALID','請使用選檔按鈕選擇 WAV。');
    if(typeof q.data!=='string'||q.data.length>Math.ceil(MAX_WAV/3)*4||!q.data.length||q.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(q.data))fail('REFERENCE_INVALID','參考 WAV 資料無效或超過 20MB。');
    const audio=Buffer.from(q.data,'base64');if(audio.length>MAX_WAV||audio.toString('base64')!==q.data)fail('REFERENCE_INVALID','參考 WAV 編碼不正確。');
    const wav=decodeWav(audio);if(wav.duration<3||wav.duration>120)fail('REFERENCE_DURATION','請選擇 3–120 秒的單人乾淨 WAV。');
    const id=randomUUID(),file=path.join(path.dirname(path.resolve(this.file)),'imports',id+'.wav');
    await atomicWrite(file,audio);const receipt={id,file,filename,seconds:wav.duration,bytes:audio.length,rate:wav.rate,channels:wav.channels,state:'staged'};this.receipts.set(id,receipt);
    return {success:true,receipt:{id,filename,seconds:wav.duration,bytes:audio.length,sampleRate:wav.rate,channels:wav.channels},notice:'僅暫存到本機插件資料區，尚未傳給 Fish；原始檔案不會被修改。'};
  }
  getReceipt(id){const r=this.receipts.get(id);if(!r)fail('REFERENCE_EXPIRED','選檔已失效，請重新選擇 WAV。');if(r.state!=='staged')fail('REFERENCE_ALREADY_USED','此參考音檔已送出，請檢查聲線清單／Fish 帳號，勿重複上傳。');return r;}
  async discard(q){fields(q,['action','receiptId']);const r=this.getReceipt(q.receiptId);await unlink(r.file).catch(e=>{if(e.code!=='ENOENT')throw e;});this.receipts.delete(r.id);return {success:true};}
  async create(q){
    fields(q,['action','receiptId','name','transcript','confirmRights','confirmUpload','confirmCost']);
    if(q.confirmRights!==true||q.confirmUpload!==true||q.confirmCost!==true)fail('UPLOAD_CONFIRMATION_REQUIRED','請本人確認聲音使用權、此檔上傳 Fish 與可能費用，再按建立。');
    const r=this.getReceipt(q.receiptId),c=await readConfig(this.file),name=string(q.name,80,'角色名稱');
    if(!name)fail('SETTINGS_INPUT_INVALID','請替角色取一個名稱。');
    if((await profiles(c)).some(p=>p.name===name))fail('PROFILE_EXISTS','此角色名稱已存在，請取新名稱。');
    requireCloud({...c,rightsConfirmed:true,allowPaidRequests:true,allowReferenceUpload:true},true);
    const audio=await readFile(r.file);decodeWav(audio);
    const transcript=q.transcript===undefined?'':string(q.transcript,6000,'逐字稿');
    r.state='submitted';
    // Mark before the paid POST. An uncertain failure must not silently unlock a duplicate upload.
    const created=await this.providerFactory(c).createVoice({name,audio,transcript});
    const profile={name,...created};r.state='created';
    try{
      await saveProfile(c,profile);
      const raw=await readStoredConfig(this.file);raw.defaultProfile=name;raw.defaultReferenceId='';raw.rightsConfirmed=true;raw.allowPaidRequests=true;
      // GUI consent applies to this receipt; do not enable future model-requested uploads.
      await atomicWrite(this.file,JSON.stringify(raw,null,2));
    }catch{return {success:false,error_code:'PROFILE_SAVE_FAILED',error_message:'Fish 聲線已建立，但本機儲存失敗。請保留 reference_id，使用進階匯入；不要重複上傳。',profile};}
    await unlink(r.file).catch(()=>{});this.receipts.delete(r.id);
    return {...await this.snapshot(),createdProfile:profile,notice:'角色聲線已建立並設為預設。回到 DSH，用自然語言要求角色說話即可。'};
  }
  async importReference(q){
    fields(q,['action','name','referenceId']);const name=string(q.name,80,'角色名稱'),reference_id=string(q.referenceId,256,'reference_id');
    if(!name||!reference_id)fail('SETTINGS_INPUT_INVALID','角色名稱及 reference_id 不可空白。');const c=await readConfig(this.file);
    await saveProfile(c,{name,reference_id,state:'imported'});const raw=await readStoredConfig(this.file);raw.defaultProfile=name;raw.defaultReferenceId='';await atomicWrite(this.file,JSON.stringify(raw,null,2));return this.snapshot();
  }
  async removeProfile(q){
    fields(q,['action','name','confirm']);if(q.confirm!==true)fail('SETTINGS_INPUT_INVALID','請確認只移除本機聲線紀錄。');const c=await readConfig(this.file),all=await profiles(c);
    await atomicWrite(path.join(c.dataRoot,'profiles.json'),JSON.stringify(all.filter(p=>p.name!==q.name),null,2));
    const raw=await readStoredConfig(this.file);if(raw.defaultProfile===q.name){raw.defaultProfile='';await atomicWrite(this.file,JSON.stringify(raw,null,2));}
    return {...await this.snapshot(),notice:'只移除本機紀錄，沒有刪除原始 WAV 或 Fish 雲端聲線。'};
  }
}
