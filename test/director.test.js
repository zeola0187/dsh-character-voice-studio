import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {compilePerformance,CONTROLS,performanceSchema} from '../lib/director.js';
import {VoiceStudio,validateRequest} from '../lib/service.js';
import {FishProvider} from '../lib/fish.js';
import {encodeWav,decodeWav,joinWav} from '../lib/audio.js';
import {directorSkill} from '../lib/director-skill.js';
const speech=(text,control)=>({type:'speech',text,...(control?{controls:[control]}:{})});
const pause=duration_ms=>({type:'pause',duration_ms});
const sound=event=>({type:'sound',event});
const plan={text:'你好。晚安。',direction:'溫柔安慰',performance:[speech('你好。','soft'),sound('breath'),pause(2000),speech('晚安。','whisper')]};
const wav=()=>encodeWav(Buffer.alloc(8820,12));
async function fixture(t){const root=await mkdtemp(path.join(os.tmpdir(),'voice-director-'));t.after(()=>rm(root,{recursive:true,force:true}));const configFile=path.join(root,'config.json');await writeFile(configFile,JSON.stringify({fishApiKey:'synthetic-test',defaultReferenceId:'fixture-voice',rightsConfirmed:true,allowPaidRequests:true,timeoutMs:1000}));return {root,configFile};}

test('legacy simple text, overall direction and segments keep their scripts',()=>{
 const s=new VoiceStudio({configFile:'does-not-exist',providerFactory:()=>{throw Error('no cloud');}});
 assert.equal(s.preview({text:'晚安。'}).segments[0].script,'晚安。');
 assert.equal(s.preview({text:'晚安。',direction:'溫柔'}).segments[0].script,'[溫柔]晚安。');
 assert.equal(s.preview({text:'你好。晚安。',direction:'溫柔',segments:[{text:'你好。'},{text:'晚安。',direction:'平靜',pause_before_ms:2000}]}).segments[1].script,'[平靜]晚安。');
});
for(const control of CONTROLS)test(`official local ${control} compiles in one request`,()=>{
 const p=compilePerformance('前句重點後句',[speech('前句'),speech('重點',control),speech('後句')]);
 assert.equal(p.length,1);assert.equal(p[0].script,`前句<${control}>重點</${control}>後句`);assert.equal(p[0].text,'前句重點後句');
});
test('mid-sentence directions, fast/slow/whisper and sound events do not create extra requests',()=>{
 const p=compilePerformance('先快再慢秘密',[speech('先快','fast'),{...speech('再慢','slow'),direction:'冷靜轉為激動'},sound('sigh'),speech('秘密','whisper'),sound('chuckle'),sound('laugh')],'平靜');
 assert.equal(p.length,1);assert.equal(p[0].script,'[平靜]<fast>先快</fast>[冷靜轉為激動]<slow>再慢</slow>[sigh]<whisper>秘密</whisper>[soft chuckle][laugh]');
});
test('controls plus exact 2-second pause retain 88200 zero frames, no model pause token',()=>{
 const p=validateRequest(plan).segments;assert.equal(p.length,2);assert.equal(p[0].script,'[溫柔安慰]<soft>你好。</soft>[breath]');assert.equal(p[1].script,'[溫柔安慰]<whisper>晚安。</whisper>');
 const joined=joinWav(p.map(s=>({...s,audio:wav()})));const a=decodeWav(joined.bytes);assert.equal(joined.silences[0].frames,88200);assert(a.pcm.subarray(8820,8820+176400).every(x=>x===0));
});
test('leading/trailing/consecutive pauses coalesce without empty requests; zero does not split',()=>{
 const p=compilePerformance('ab',[pause(100),pause(200),speech('a'),pause(0),speech('b'),pause(300),pause(400)]);
 assert.equal(p.length,1);assert.equal(p[0].script,'ab');assert.equal(p[0].pause_before_ms,300);assert.equal(p[0].pause_after_ms,700);
});
test('Chinese English Japanese spaces punctuation emoji and combining characters remain exact',()=>{
 const text='你好， hello!\n日本語。 e\u0301 😀';const p=[speech('你好， '),speech('hello!\n','emphasis'),sound('breath'),speech('日本語。 e\u0301 😀','soft')];
 assert.equal(compilePerformance(text,p)[0].text,text);
 for(const changed of [text.trimEnd()+' ',text.replace('e\u0301','é'),text.replace('\n',' '),text+'。'])assert.throws(()=>compilePerformance(changed,p),{code:'TEXT_PERFORMANCE_MISMATCH'});
});
test('loss, duplication, translation and reordered speech are rejected',()=>{
 for(const p of [[speech('你好')],[speech('你好你好。')],[speech('Hello.')],[speech('。你好')]])assert.throws(()=>compilePerformance('你好。',p),{code:'TEXT_PERFORMANCE_MISMATCH'});
});
test('raw tags, control characters, malformed Unicode and script escape hatches rejected',()=>{
 for(const value of ['[laugh]','<whisper>x</whisper>','x\u0000','x\ud800']){
  assert.throws(()=>compilePerformance(value,[speech(value)]));
  assert.throws(()=>compilePerformance('x',[{...speech('x'),direction:value}]));
 }
 assert.throws(()=>validateRequest({text:'x',script:'<arbitrary>x</arbitrary>'}));
 assert.throws(()=>validateRequest({text:'x',direction:'[sigh]'}));
 assert.throws(()=>compilePerformance('x',[{...speech('x'),script:'injected'}]));
});
test('unknown nodes/fields/events, unsupported controls and nested combinations are errors',()=>{
 for(const node of [{type:'unknown'},sound('sing'),sound(['breath']),{...sound('breath'),duration_ms:10},{...pause(1),text:'x'},{...speech('x'),controls:['raw']},{...speech('x'),controls:['whisper','soft']},{...speech('x'),controls:null},{...speech('x'),controls:['fast','fast']}])assert.throws(()=>compilePerformance('x',[node]));
});
test('node, text, per-request, event, request, pause and byte budgets fail before any call',()=>{
 for(const p of [[],Array(101).fill(speech('x')),[speech('x'.repeat(1501))],Array.from({length:21},()=>[speech('x'),pause(1)]).flat(),[speech('x'),...Array(21).fill(sound('breath'))],[speech('x'),...Array(5).fill(pause(30000))],[speech('x'),pause(30001)],[speech('x'),pause(1.5)],[speech('x'),pause(-1)],Array.from({length:50},()=>({...speech('x'),direction:'慢'.repeat(500)}))])assert.throws(()=>compilePerformance('x',p));
 assert.throws(()=>compilePerformance('x'.repeat(6001),[speech('x')]));
 assert.throws(()=>compilePerformance('x',[sound('breath'),pause(100),speech('x')]));
});
test('new and old fields conflict explicitly; legacy only remains valid',()=>{
 assert.throws(()=>validateRequest({...plan,segments:[{text:plan.text}]}),{code:'PERFORMANCE_CONFLICT'});
 assert.throws(()=>validateRequest({...plan,performance:null}));
 assert.equal(validateRequest({text:'x',segments:[{text:'x'}]}).segments.length,1);
});
test('total compiled UTF-8 budget spans otherwise valid individual requests',()=>{
 const part=()=>Array.from({length:10},()=>({...speech('字'),direction:'慢'.repeat(500)}));
 const performance=[...part(),pause(1),...part(),pause(1),...part(),pause(1),...part()];
 assert.throws(()=>compilePerformance('字'.repeat(40),performance),e=>e.code==='INVALID_PERFORMANCE'&&e.message.includes('UTF-8'));
});
test('schema enumerates only supported nodes and controls; bundled skill contains full instructions',()=>{
 assert.deepEqual(performanceSchema.items.oneOf.map(n=>n.properties.type.const),['speech','sound','pause']);
 assert.deepEqual(performanceSchema.items.oneOf[0].properties.controls.items.enum,CONTROLS);
 assert.equal(directorSkill.name,'character-voice-director');assert(directorSkill.invocation.modelInvocable);assert(directorSkill.content.includes('preview_character_audio'));
});
test('preview works with absent config and no provider, returns same scripts as generation validator',()=>{
 const studio=new VoiceStudio({configFile:'not-read',providerFactory:()=>{throw Error('no call');}});const preview=studio.preview(plan);
 assert(preview.success);assert.equal(preview.paid_requests,2);assert.deepEqual(preview.segments.map(s=>s.script),validateRequest(plan).segments.map(s=>s.script));assert(!JSON.stringify(preview).includes('fishApiKey'));
});
test('real Fish adapter receives compiled Drama3 text; service delivers valid WAV twice',async t=>{
 const f=await fixture(t),seen=[];const studio=new VoiceStudio({configFile:f.configFile,providerFactory:c=>new FishProvider(c,async(url,o)=>{seen.push(JSON.parse(o.body));assert.equal(o.headers.model,'drama-3');return new Response(wav());})});
 for(let i=0;i<2;i++){const r=await studio.generate(plan,{cwd:f.root});assert(r.success,JSON.stringify(r));assert.equal(decodeWav(await readFile(r.file_path)).duration,2.2);assert.equal(r.segment_count,2);}
 assert.equal(seen.length,4);assert.equal(seen[0].text,studio.preview(plan).segments[0].script);assert.equal(seen[0].reference_id,'fixture-voice');
});
test('partial failure stops without retry or output and allows subsequent generation',async t=>{
 const f=await fixture(t);let calls=0;const studio=new VoiceStudio({configFile:f.configFile,providerFactory:c=>new FishProvider(c,async()=>{calls++;return calls===2?new Response('fail',{status:503}):new Response(wav());})});
 const r=await studio.generate(plan,{cwd:f.root});assert.equal(r.error_code,'FISH_SERVER_ERROR');assert.equal(r.completed_segments,1);assert.equal(calls,2);assert(!(await readdir(f.root)).includes('generated_audio'));
 assert((await studio.generate(plan,{cwd:f.root})).success);assert.equal(calls,4);
});
test('cancellation after a paid segment never sends the next or retries; busy lock recovers',async t=>{
 const f=await fixture(t),ac=new AbortController();let calls=0;const studio=new VoiceStudio({configFile:f.configFile,providerFactory:()=>({generate:async()=>{calls++;if(calls===1)ac.abort();return wav();}})});
 const r=await studio.generate(plan,{cwd:f.root,signal:ac.signal});assert.equal(r.error_code,'CANCELLED');assert.equal(calls,1);assert.equal(r.completed_segments,1);assert(!(await readdir(f.root)).includes('generated_audio'));
 assert((await studio.generate(plan,{cwd:f.root})).success);assert.equal(calls,3);
});
