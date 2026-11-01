// Official CLI overlay for a disposable base + installed voice bundle profile.
// No model/Fish request, private settings, reference material or Desktop changes.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export const name='voice-director-profile-probe';
export const inject=['skills','tools'];
export function apply(ctx){void(async()=>{
  const signal=AbortSignal.timeout(15000);
  const expected=['generate_character_audio','preview_character_audio','list_voice_profiles','create_voice_profile','check_voice_connection','skill'];
  while(!expected.every(n=>ctx.tools.schemas().some(t=>t.name===n))){signal.throwIfAborted();await new Promise(r=>setTimeout(r,25));}
  const catalog=await ctx.skills.list({signal});
  const summary=catalog.find(s=>s.name==='character-voice-director');assert(summary,'Installed bundle did not register its Skill');
  assert.equal(summary.source,'bundled');assert.equal(summary.invocation.modelInvocable,true);assert(!Object.hasOwn(summary,'content'));
  const loaded=await ctx.tools.execute({callId:'installed-skill-load',name:'skill',arguments:{name:summary.name},signal});
  assert.equal(loaded.isError,false,JSON.stringify(loaded));assert(loaded.value.content.includes('preview_character_audio'));
  const args={text:'你好。晚安。',performance:[{type:'speech',text:'你好。',controls:['soft']},{type:'sound',event:'breath'},{type:'pause',duration_ms:2000},{type:'speech',text:'晚安。',controls:['whisper']}]};
  const preview=await ctx.tools.execute({callId:'installed-preview',name:'preview_character_audio',arguments:args,signal});
  assert(preview.value.success,JSON.stringify(preview));assert.equal(preview.value.paid_requests,2);assert.equal(preview.value.segments[0].script,'<soft>你好。</soft>[breath]');
  const noKey=await ctx.tools.execute({callId:'installed-no-key',name:'generate_character_audio',arguments:args,signal});assert.equal(noKey.value.error_code,'FISH_KEY_REQUIRED');
  const bad=await ctx.tools.execute({callId:'installed-bad-node',name:'preview_character_audio',arguments:{text:'x',performance:[{type:'speech',text:'x',controls:['unknown']}]},signal});assert(bad.isError||bad.value?.success===false,'Invalid control accepted');
  const evidence={success:true,installedBundle:true,skillSummaryHasBody:false,onDemandNativeSkillTool:true,skillName:summary.name,source:summary.source,nativeTools:expected,compiledScripts:preview.value.segments.map(s=>s.script),requestCount:2,pauseMs:2000,missingKey:noKey.value.error_code,invalidControlRejected:true,modelCalls:0,fishCalls:0,desktopTouched:false};
  await writeFile(process.env.DSH_VOICE_PROBE_RESULT,JSON.stringify(evidence,null,2));console.log('VOICE_DIRECTOR_INSTALLED_PROFILE_PASS');process.exit(0);
})().catch(error=>{console.error('VOICE_DIRECTOR_INSTALLED_PROFILE_FAIL',error.message);process.exit(1);});}
