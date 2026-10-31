export function inspectSelectedWav(bytes){
  const view=new DataView(bytes),tag=(p,n)=>String.fromCharCode(...new Uint8Array(bytes,p,n));
  if(bytes.byteLength<44||bytes.byteLength>20*1024*1024||tag(0,4)!=='RIFF'||tag(8,4)!=='WAVE'||view.getUint32(4,true)+8!==bytes.byteLength)throw Error('請選擇完整、有效且不超過 20MB 的 WAV。');
  let fmt,data;
  for(let p=12;p<bytes.byteLength;){if(p+8>bytes.byteLength)throw Error('WAV 檔案損毀。');const n=view.getUint32(p+4,true),start=p+8;if(start+n>bytes.byteLength)throw Error('WAV 檔案不完整。');if(tag(p,4)==='fmt '){if(fmt!==undefined||n<16)throw Error('WAV 格式無效。');fmt=start;}if(tag(p,4)==='data'){if(data!==undefined)throw Error('WAV 格式無效。');data=n;}p=start+n+(n%2);}
  if(fmt===undefined||!data)throw Error('WAV 沒有有效音訊。');
  const channels=view.getUint16(fmt+2,true),rate=view.getUint32(fmt+4,true),align=view.getUint16(fmt+12,true);
  if(view.getUint16(fmt,true)!==1||view.getUint16(fmt+14,true)!==16||![1,2].includes(channels)||rate<8000||rate>192000||align!==channels*2||view.getUint32(fmt+8,true)!==rate*align||data%align)throw Error('請使用 PCM16 單聲道或雙聲道 WAV。');
  const seconds=data/(rate*align);if(seconds<3||seconds>120)throw Error('請選擇 3–120 秒的乾淨單人 WAV。');return {seconds,channels,sampleRate:rate};
}
export function bytesToBase64(bytes){let s='';const b=new Uint8Array(bytes);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,i+0x8000));return btoa(s);}

export function createSettingsComponent(React){
  const h=React.createElement;
  return function CharacterVoiceSettings({api,pickDirectory}){
    const [state,setState]=React.useState(null),[key,setKey]=React.useState(''),[draft,setDraft]=React.useState({}),[status,setStatus]=React.useState('正在讀取設定…'),[busy,setBusy]=React.useState(false),[receipt,setReceipt]=React.useState(null),[name,setName]=React.useState(''),[transcript,setTranscript]=React.useState(''),[consent,setConsent]=React.useState(false),[importId,setImportId]=React.useState(''),[importName,setImportName]=React.useState(''),[removeConfirmed,setRemoveConfirmed]=React.useState(false);
    const absorb=v=>{setState(v);setDraft({defaultProfile:v.defaultProfile,defaultReferenceId:v.defaultReferenceId,outputDirectory:v.outputDirectory,defaultFormat:'wav',rightsConfirmed:v.rightsConfirmed,allowPaidRequests:v.allowPaidRequests});};
    React.useEffect(()=>{let alive=true;api({action:'get'}).then(v=>{if(alive){absorb(v);setStatus(v.keyConfigured?'設定已載入；既有 Key 不會顯示。':'先填入 Fish Audio API Key 並儲存。');}}).catch(()=>{if(alive)setStatus('無法讀取設定，請確認此插件已啟用並重新開啟頁面。');});return()=>{alive=false;};},[]);
    const act=fn=>async()=>{if(busy)return;setBusy(true);setStatus('');try{await fn();}catch(e){setStatus(e.safeMessage||'操作未完成。請重新載入設定或稍後再試；沒有自動重送付費請求。');}finally{setBusy(false);}};
    const saveSettings=async keyAction=>{const request={action:'save',revision:state.revision,...draft,keyAction};if(keyAction==='replace')request.fishApiKey=key;const v=await api(request);setKey('');absorb(v);setStatus(keyAction==='clear'?'Key 已移除；雲端生成已停用。':'已儲存。設定立即生效，不需要重啟。');};
    const save=keyAction=>act(()=>saveSettings(keyAction));
    const field=(label,value,onChange,props={})=>h('label',{style:{display:'grid',gap:5}},label,h('input',{value,onChange:e=>onChange(e.target.value),disabled:busy,...props}));
    const check=(label,value,onChange)=>h('label',{style:{display:'flex',alignItems:'start',gap:8}},h('input',{type:'checkbox',checked:value===true,onChange:e=>onChange(e.target.checked),disabled:busy}),label);
    const update=(k,v)=>setDraft(d=>({...d,[k]:v}));
    const selectFile=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file||busy)return;await act(async()=>{
      if(file.size>20*1024*1024||!/\.wav$/i.test(file.name))throw {safeMessage:'請選擇 20MB 以下的 WAV。'};
      let bytes;try{bytes=await file.arrayBuffer();inspectSelectedWav(bytes);}catch(e){throw {safeMessage:e.message||'無法讀取 WAV。'};}
      if(receipt){await api({action:'discard_wav',receiptId:receipt.id});setReceipt(null);}
      const v=await api({action:'stage_wav',filename:file.name,data:bytesToBase64(bytes)});setReceipt(v.receipt);setConsent(false);setStatus(v.notice);
    })();};
    if(!state)return h('section',{'aria-label':'角色語音設定'},h('h2',null,'角色語音'),h('p',{role:'status'},status));
    return h('section',{'aria-label':'角色語音設定',style:{maxWidth:760,padding:'16px 0',display:'grid',gap:14}},
      h('h2',null,'角色語音'),h('p',null,'設定一次聲線，之後直接在 DSH 對話中描述要說的台詞與語氣，取得可保存的 WAV。'),
      h('h3',null,'1. 設定 Fish Audio'),
      h('p',null,state.keyConfigured?'API Key：已設定（不顯示原值）':'API Key：尚未設定'),
      field(state.keyConfigured?'更新 API Key（留空保留原值）':'Fish Audio API Key',key,setKey,{type:'password',autoComplete:'new-password',spellCheck:false,'aria-label':'Fish Audio API Key'}),
      h('small',null,'Key 只保存於此 DSH 主機的本機設定，不送入聊天、模型提示詞或工具結果。留空儲存不會移除 Key。'),
      check('我擁有角色聲音與素材所需的使用權限。',draft.rightsConfirmed,v=>update('rightsConfirmed',v)),
      check('允許之後依我的指令將台詞與語氣送至 Fish 生成，並接受可能費用。',draft.allowPaidRequests,v=>update('allowPaidRequests',v)),
      h('div',{style:{display:'flex',gap:8}},h('button',{disabled:busy,onClick:save(key.trim()?'replace':'keep')},'儲存設定'),h('button',{disabled:busy||!state.keyConfigured,onClick:act(async()=>{if(!globalThis.confirm('確定移除本機 Fish API Key 並停用環境變數 Key 回退？'))return;await saveSettings('clear');})},'移除 Key')),
      h('h3',null,'2. 建立角色聲線'),
      h('p',null,'選擇你已準備好的乾淨單人 WAV（3–120 秒，20MB 以下）。選檔只會送到所連線 DSH 主機的本機資料區暫存及驗證，尚不會傳給 Fish，也不會修改原始檔。'),
      h('label',null,'選擇 WAV',h('input',{type:'file',accept:'.wav,audio/wav','aria-label':'選擇參考 WAV',disabled:busy,onChange:selectFile})),
      receipt?h('div',null,h('p',null,`${receipt.filename} · ${receipt.seconds.toFixed(1)} 秒 · ${receipt.sampleRate} Hz · ${receipt.channels} 聲道`),h('button',{disabled:busy,onClick:act(async()=>{await api({action:'discard_wav',receiptId:receipt.id});setReceipt(null);setConsent(false);setStatus('已移除暫存拷貝；原始 WAV 未變更。');})},'取消選檔')):null,
      field('角色名稱',name,setName,{'aria-label':'角色名稱',maxLength:80,placeholder:'例如：溫柔的晚安角色'}),
      h('details',null,h('summary',null,'可選：參考音檔逐字稿'),h('textarea',{'aria-label':'參考音檔逐字稿',value:transcript,onChange:e=>setTranscript(e.target.value),maxLength:6000,disabled:busy,rows:3})),
      check('我確認有權使用此聲音，同意將這份 WAV 上傳 Fish 建立私人聲線，以及本次和之後依我指令生成的可能費用。',consent,setConsent),
      h('button',{disabled:busy||!state.keyConfigured||!receipt||!name.trim()||!consent,onClick:act(async()=>{setStatus('正在上傳並建立 Fish 私人聲線…請勿重複送出。');const v=await api({action:'create_voice',receiptId:receipt.id,name,transcript,confirmRights:consent,confirmUpload:consent,confirmCost:consent});absorb(v);setReceipt(null);setConsent(false);setName('');setTranscript('');setStatus(v.notice);})},'建立私人聲線並設為預設'),
      !state.keyConfigured?h('small',null,'請先完成上方 API Key 儲存，才能建立聲線。'):null,
      h('h3',null,'3. 選擇預設角色'),
      h('label',null,'預設角色',h('select',{'aria-label':'預設角色',value:draft.defaultProfile,disabled:busy,onChange:e=>{update('defaultProfile',e.target.value);update('defaultReferenceId','');}},h('option',{value:''},state.profiles.length?'未指定（使用第一個角色／進階 ID）':'尚無聲線，先從上方建立'),...state.profiles.map(p=>h('option',{key:p.name,value:p.name},p.name)))),
      h('button',{disabled:busy,onClick:save('keep')},'儲存預設角色'),
      h('p',null,'回到 DSH 可以直接說：「讓預設角色溫柔、慢慢地說『今天辛苦了。晚安。』，晚安前停兩秒，生成音檔並交付。」'),
      h('details',null,h('summary',null,'進階：既有聲線 ID、輸出位置與移除紀錄'),
        field('匯入角色名稱',importName,setImportName,{'aria-label':'匯入角色名稱'}),field('既有 Fish reference_id',importId,setImportId,{'aria-label':'既有 reference_id'}),
        h('button',{disabled:busy||!importName.trim()||!importId.trim(),onClick:act(async()=>{absorb(await api({action:'import_reference',name:importName,referenceId:importId}));setImportId('');setImportName('');setStatus('聲線已匯入並設為預設，沒有呼叫 Fish。');})},'匯入並設為預設'),
        field('輸出資料夾（留空使用目前工作區 generated_audio）',draft.outputDirectory,v=>update('outputDirectory',v),{'aria-label':'輸出資料夾'}),
        pickDirectory?h('button',{disabled:busy,onClick:act(async()=>{const folder=await pickDirectory();if(folder!==null)update('outputDirectory',folder);})},'選擇輸出資料夾'):null,
        h('p',null,'格式：WAV（MP3 尚未啟用）'),h('button',{disabled:busy,onClick:save('keep')},'儲存進階設定'),
        check('只移除目前選定角色的本機紀錄，不刪原始 WAV 或 Fish 雲端聲線。',removeConfirmed,setRemoveConfirmed),
        h('button',{disabled:busy||!draft.defaultProfile||!removeConfirmed,onClick:act(async()=>{const v=await api({action:'remove_profile',name:draft.defaultProfile,confirm:removeConfirmed});absorb(v);setRemoveConfirmed(false);setStatus(v.notice);})},'移除本機聲線紀錄')),
      h('p',{role:'status','aria-live':'polite'},busy?(status||'處理中…'):status),h('small',null,'設定與聲線保存在 DSH 主機使用者目錄的 .dsh-character-voice-studio；已建立聲線會清除這次暫存 WAV。未完成或中斷的暫存可能保留在 imports。')
    );
  };
}
