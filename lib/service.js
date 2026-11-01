import path from 'node:path';
import { readFile, stat, realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { decodeWav, joinWav } from './audio.js';
import { readConfig, requireCloud, profiles, saveProfile, atomicWrite } from './config.js';
import { FishProvider } from './fish.js';
import { fail, resultError } from './errors.js';
import { compilePerformance } from './director.js';

const textField=(v,max,label,required=false)=>{
  if(v===undefined&&!required)return '';
  if(typeof v!=='string'||(required&&!v.trim())||v.length>max)fail('INVALID_INPUT',`${label} 必須是非空文字，最多 ${max} 字元。`);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v))fail('INVALID_INPUT',`${label} 含控制字元。`);return v;
};
function direction(v){const s=textField(v,500,'語氣');if(/[\[\]<>]/u.test(s))fail('INVALID_DIRECTION','語氣請填自然語言，不要自行加入方括號或 XML 標籤。');return s;}
const pause=v=>{if(v===undefined)return 0;if(!Number.isInteger(v)||v<0||v>30000)fail('INVALID_PAUSE','停頓須為 0–30000 毫秒整數。');return v;};
export function validateRequest(a,c={}){
  if(!a||typeof a!=='object')fail('INVALID_INPUT','缺少生成內容。');
  const text=textField(a.text,6000,'台詞',true),style=direction(a.direction),format=a.format||c.defaultFormat||'wav';
  if(format!=='wav')fail('FORMAT_UNAVAILABLE','首版提供已驗證 WAV；MP3 尚未啟用可靠轉碼，請選 wav。');
  // Literal dialogue is not a control channel. Reject ambiguous inline tags rather than change words.
  if(/[\[\]<>]/u.test(text))fail('INLINE_TAGS_NOT_ALLOWED','台詞含模型控制標籤字元。請將表演指示移至 direction，台詞只放要念的原文。');
  if(Object.hasOwn(a,'script'))fail('INVALID_INPUT','不可直接提供 Fish 腳本；請使用 performance。');
  if(a.performance!==undefined&&a.segments!==undefined)fail('PERFORMANCE_CONFLICT','performance 與 segments 不可同時提供。');
  let segments=a.segments;
  if(a.performance!==undefined)segments=compilePerformance(text,a.performance,style);
  if(segments!==undefined && (!Array.isArray(segments)||segments.length<1||segments.length>20))fail('SEGMENT_LIMIT','分段數須為 1–20。');
  segments=(segments??[{text,direction:style}]).map(s=>{
    if(!s||typeof s!=='object')fail('INVALID_INPUT','分段格式無效。');
    if(a.performance!==undefined)return s; // Already validated by the bounded compiler; never accept client scripts.
    return {text:textField(s.text,1500,'每段台詞',true),direction:s.direction===undefined?style:direction(s.direction),pause_before_ms:pause(s.pause_before_ms),pause_after_ms:pause(s.pause_after_ms)};
  });
  if(segments.map(s=>s.text).join('')!==text)fail('TEXT_SEGMENT_MISMATCH','segments 台詞依序連接必須與 text 完全相同，包含標點與空白。');
  if(segments.reduce((n,s)=>n+s.pause_before_ms+s.pause_after_ms,0)>120000)fail('PAUSE_LIMIT','總明確停頓不得超過 120 秒。');
  const outputName=textField(a.output_name,80,'檔名')||'角色語音';
  if(/[<>:"/\\|?*\u0000-\u001f]/u.test(outputName)||/^\.+$/.test(outputName)||/[. ]$/.test(outputName)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(outputName))fail('INVALID_FILENAME','請使用單純檔名，不含路徑或 Windows 保留字元。');
  return {segments,format,outputName:outputName.replace(/\.wav$/i,'')};
}
export class VoiceStudio {
  constructor({configFile,providerFactory=c=>new FishProvider(c)}={}){this.configFile=configFile;this.providerFactory=providerFactory;this.busy=false;}
  preview(a){try{const r=validateRequest(a);return {success:true,paid_requests:r.segments.length,format:r.format,segments:r.segments.map(s=>({text:s.text,script:s.script??(s.direction?`[${s.direction}]`:'')+s.text,pause_before_ms:s.pause_before_ms,pause_after_ms:s.pause_after_ms})),notice:'僅離線預覽，不讀 Key、不連線。靜音毫秒精確；表演、事件時長和總可聽停頓不保證。'};}catch(e){return resultError(e);}}
  async list(){try{const c=await readConfig(this.configFile);return {success:true,profiles:await profiles(c),default_profile:c.defaultProfile||'',default_reference_id:c.defaultReferenceId||'',configured:!!c.fishApiKey,rights_confirmed:c.rightsConfirmed===true,paid_requests_enabled:c.allowPaidRequests===true,setup_hint:'沒有聲線時，請引導使用者開啟 DSH 設定 → 角色語音，選擇 WAV 並本人確認建立；不需要輸入路徑或 ID。'};}catch(e){return resultError(e);}}
  async exclusive(fn){if(this.busy)return {success:false,error_code:'BUSY',error_message:'已有語音工作進行中，請等待或取消。'};this.busy=true;try{return await fn();}catch(e){return resultError(e);}finally{this.busy=false;}}
  async create(a,{signal,cwd}={}){return this.exclusive(async()=>{
    signal?.throwIfAborted();const c=await readConfig(this.configFile),name=textField(a.name,80,'聲線名稱',true);
    if((await profiles(c)).some(p=>p.name===name))fail('PROFILE_EXISTS','此名稱已存在，請選新聲線名稱。');
    let profile;
    if(a.reference_id){if(a.path||a.transcript)fail('INVALID_INPUT','匯入 ID 與上傳 WAV 請擇一。');profile={name,reference_id:textField(a.reference_id,256,'reference_id',true),state:'imported'};}
    else{
      requireCloud(c,true);textField(a.path,4096,'參考 WAV 路徑',true);
      const target=path.resolve(cwd||process.cwd(),a.path),file=await realpath(target),info=await stat(file);
      if(!info.isFile()||info.size>20*1024*1024||info.size<44||path.extname(file).toLowerCase()!=='.wav')fail('REFERENCE_INVALID','請選擇不超過 20MB 的乾淨 PCM16 WAV。');
      const audio=await readFile(file,{signal});const decoded=decodeWav(audio);
      if(decoded.duration<3||decoded.duration>120)fail('REFERENCE_DURATION','參考 WAV 請使用 3–120 秒單人乾淨錄音。');
      profile={name,...await this.providerFactory(c).createVoice({name,audio,transcript:textField(a.transcript,6000,'逐字稿')},signal)};
    }
    // Preserve a remote creation receipt even if cancellation/local persistence fails.
    // A successful POST must not disappear behind a generic error and invite a duplicate charge.
    if(signal?.aborted)return {success:false,error_code:'CANCELLED',error_message:'已取消；若聲線已建立，請保留回傳 reference_id，之後使用 ID 匯入，不要重複上傳。',profile};
    try{await saveProfile(c,profile);}catch(e){return {success:false,error_code:'PROFILE_SAVE_FAILED',error_message:'本機聲線清單儲存失敗。請保留此 reference_id，修正資料夾權限後用 ID 匯入，勿再次上傳。',profile};}
    return {success:true,profile};
  });}
  async generate(a,{signal,cwd}={}){return this.exclusive(async()=>{
    signal?.throwIfAborted();const c=await readConfig(this.configFile),request=validateRequest(a,c);requireCloud(c);
    if(!cwd||!path.isAbsolute(cwd))fail('WORKSPACE_REQUIRED','請先在 DSH 選定本機工作區。');
    const all=await profiles(c),selected=a.voice_profile||c.defaultProfile;
    const profile=selected?all.find(p=>p.name===selected||p.reference_id===selected):(!c.defaultReferenceId?all[0]:undefined);
    const referenceId=profile?.reference_id||(!selected?c.defaultReferenceId:undefined);
    if(!referenceId)fail('VOICE_PROFILE_REQUIRED','請先到 DSH「設定 → 角色語音」選擇乾淨 WAV，建立角色並設為預設；不需要輸入路徑或 reference_id。');
    const output=path.resolve(cwd,c.outputDirectory||'generated_audio');
    const packageRoot=path.resolve(import.meta.dirname,'..').toLowerCase(),lowerOutput=output.toLowerCase();
    if(output.split(path.sep).some(p=>p.toLowerCase()==='node_modules')||lowerOutput===packageRoot||lowerOutput.startsWith(packageRoot+path.sep))fail('OUTPUT_DIRECTORY_INVALID','輸出目錄必須位於工作區或使用者設定目錄，不得寫到插件或 node_modules。');
    const chunks=[];const provider=this.providerFactory(c);
    try{for(const segment of request.segments){signal?.throwIfAborted();const audio=await provider.generate({...segment,referenceId},signal);decodeWav(audio);chunks.push({...segment,audio});}}
    catch(e){return {...resultError(e),completed_segments:chunks.length,error_note:'先前成功段落可能已計費。本次未交付不完整音檔，沒有自動重新生成。'};}
    signal?.throwIfAborted();const joined=joinWav(chunks);decodeWav(joined.bytes);
    const filename=request.outputName+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.wav';const file=path.join(output,filename);
    await atomicWrite(file,joined.bytes);const saved=decodeWav(await readFile(file,{signal}));
    return {success:true,file_path:file,filename,format:'wav',duration_seconds:saved.duration,voice_profile:profile?.name||referenceId,segment_count:chunks.length,silence_regions:joined.silences,sample_rate:44100,next_action:'必須呼叫 DSH present，files: [{path: file_path, description: "角色語音 WAV"}]，讓使用者取得實際檔案。'};
  });}
  async check({signal}={}){return this.exclusive(async()=>{const c=await readConfig(this.configFile);requireCloud(c);const all=await profiles(c),p=all.find(p=>p.name===c.defaultProfile)||all[0];const id=p?.reference_id||c.defaultReferenceId;if(!id)fail('VOICE_PROFILE_REQUIRED','請先匯入 reference_id。');return this.providerFactory(c).check(id,signal);});}
}
