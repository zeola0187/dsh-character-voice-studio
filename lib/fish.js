import { setTimeout as sleep } from 'node:timers/promises';
import { VoiceError,fail } from './errors.js';
import { MAX_AUDIO_BYTES } from './audio.js';
import { normalizeFishWav } from './fish-wav.js';
export class FishProvider {
  constructor(config,fetcher=fetch){this.config=config;this.fetcher=fetcher;}
  async request(route,options,signal,{readOnly=false,maxBytes=MAX_AUDIO_BYTES}={}) {
    const deadline=AbortSignal.timeout(this.config.timeoutMs), combined=signal?AbortSignal.any([signal,deadline]):deadline;
    for(let attempt=0;;attempt++){
      try{
        combined.throwIfAborted();
        const response=await this.fetcher('https://api.fish.audio'+route,{...options,redirect:'error',signal:combined,headers:{Authorization:'Bearer '+this.config.fishApiKey,...options.headers}});
        if(!response.ok){await response.body?.cancel();if(readOnly && attempt<1 && [429,502,503,504].includes(response.status)){await sleep(500,undefined,{signal:combined});continue;}
          const status=response.status, codes={401:'FISH_UNAUTHORIZED',402:'FISH_BALANCE_REQUIRED',403:'FISH_FORBIDDEN',429:'FISH_RATE_LIMIT'};
          fail(codes[status] || (status>=500?'FISH_SERVER_ERROR':'FISH_REQUEST_REJECTED'),`Fish HTTP ${status}。請檢查 Key、餘額、聲線權限或稍後再試。付費 POST 不會自動重送。`);
        }
        if(!response.body)fail('EMPTY_AUDIO','Fish 回應為空。');
        const reader=response.body.getReader(),chunks=[];let size=0;
        try{for(;;){combined.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)fail('RESPONSE_LIMIT','Fish 回應超過大小限制。');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
        if(!size)fail('EMPTY_AUDIO','Fish 回應為空。');return Buffer.concat(chunks);
      }catch(e){
        if(e instanceof VoiceError)throw e;
        if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
        if(deadline.aborted)fail('FISH_TIMEOUT','Fish 請求逾時。結果與費用可能不確定，沒有自動重送。');
        fail('FISH_NETWORK_ERROR','Fish 連線中斷。結果與費用可能不確定，沒有自動重送。');
      }
    }
  }
  async generate({text,direction,script:compiledScript,referenceId},signal) {
    // compiledScript is internal output of validateRequest; no public raw-script tool parameter.
    const script=compiledScript??(direction?`[${direction}]${text}`:text);
    const bytes=await this.request('/v1/tts',{method:'POST',headers:{'Content-Type':'application/json',model:'drama-3'},body:JSON.stringify({text:script,reference_id:referenceId,format:'wav',sample_rate:44100,normalize:false,latency:'normal'})},signal);
    signal?.throwIfAborted();
    return normalizeFishWav(bytes);
  }
  async createVoice({name,audio,transcript},signal) {
    const body=new FormData();for(const [k,v]of Object.entries({type:'tts',title:name,train_mode:'fast',visibility:'private',generate_sample:'false',enhance_audio_quality:'false'}))body.append(k,v);
    body.append('voices',new Blob([audio],{type:'audio/wav'}),'reference.wav');if(transcript)body.append('texts',transcript);
    const bytes=await this.request('/model',{method:'POST',body},signal,{maxBytes:1024*1024});
    let m;try{m=JSON.parse(bytes.toString('utf8'));}catch{fail('FISH_INVALID_RESPONSE','Fish 聲線回應不是 JSON；可能已建立聲線，請先檢查帳號再重試。');}
    if(typeof m._id!=='string'||!m._id||m.visibility!=='private')fail('FISH_INVALID_RESPONSE','Fish 未確認私人聲線 ID；請先檢查帳號，避免重複建立。');
    return {reference_id:m._id,state:typeof m.state==='string'?m.state:'unknown'};
  }
  async check(referenceId,signal){const b=await this.request('/model/'+encodeURIComponent(referenceId),{method:'GET'},signal,{readOnly:true,maxBytes:1024*1024});let m;try{m=JSON.parse(b.toString());}catch{fail('FISH_INVALID_RESPONSE','Fish 聲線檢查回應不是 JSON。');}return {success:true,state:m.state??'unknown',reference_id:referenceId};}
}
