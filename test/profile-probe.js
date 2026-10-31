// Test-only official CLI overlay; never included in the installed bundle patch.
// Runs in its own disposable verification profile and never calls a model.
import {writeFile} from 'node:fs/promises';
export const name='character-voice-profile-probe';
export const inject=['tools','workingDirectory'];
export function apply(ctx){
  void (async()=>{
    const expected=['generate_character_audio','list_voice_profiles','create_voice_profile','check_voice_connection'];
    const ready=()=>expected.every(n=>ctx.tools.schemas().some(t=>t.name===n));
    if(!ready())await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{dispose();reject(Error('Timeout waiting for bundle tools'));},10000);
      const dispose=ctx.on('tools/change',()=>{if(ready()){clearTimeout(timer);dispose();resolve();}});
    });
    const names=ctx.tools.schemas().map(t=>t.name);
    if(!expected.every(n=>names.includes(n)))throw Error('Bundle tools not mounted: '+names.join(','));
    const result=await ctx.tools.execute({callId:'profile-probe',name:'generate_character_audio',arguments:{text:'晚安。'},signal:new AbortController().signal});
    if(result.value?.error_code!=='FISH_KEY_REQUIRED')throw Error('Expected friendly missing key: '+JSON.stringify(result));
    const evidence={success:true,profile:'voice-studio-verification',native_tools:expected,missing_key:result.value,model_calls:0};
    await writeFile(process.env.DSH_VOICE_PROBE_RESULT,JSON.stringify(evidence,null,2));console.log('VOICE_PROFILE_PROBE_PASS');process.exit(0);
  })().catch(e=>{console.error('VOICE_PROFILE_PROBE_FAIL',e.message);process.exit(1);});
}
