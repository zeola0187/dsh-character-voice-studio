// Runs only when explicitly launched with the installed DSH Electron Node runtime.
// Actual Cordis/tools/present packages; fake session, filesystem adapter and Fish transport.
// Does NOT inspect or mutate the running Desktop Host, private sessions or credentials.
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');const {registerHooks}=require('node:module');
const host=process.env.DSH_TEST_MODULES;
if(!host)throw Error('Set DSH_TEST_MODULES to the installed dsh/node_modules directory');
registerHooks({resolve(specifier,context,next){if(specifier==='@deepseek-ai/dsh-tools'&&!context.parentURL?.includes('app.asar'))return next(pathToFileURL(path.join(host,specifier,'lib/index.js')).href,context);return next(specifier,context);}});
(async()=>{
 const load=n=>import(pathToFileURL(path.join(host,'@deepseek-ai',n,'lib/index.js')).href);
 const {Context}=await load('cordis');const {default:Tools}=await load('dsh-tools');const {createScope}=await load('dsh-scope');
 const ctx=new Context();ctx.provide('systemPrompt',{tools(){},section(){},getSectionOrder(){return 0;}});
 const tools=new Tools(ctx,{mode:'native'});
 const {SkillRegistry}=await load('dsh-skill');new SkillRegistry(ctx);
 ctx.provide('agents',{});
 const root=path.resolve(__dirname,'../test-output/native');fs.mkdirSync(root,{recursive:true});
 process.env.DSH_CHARACTER_VOICE_CONFIG=path.join(root,'config.json');delete process.env.FISH_API_KEY;
 fs.writeFileSync(process.env.DSH_CHARACTER_VOICE_CONFIG,JSON.stringify({outputDirectory:root}));
 ctx.provide('workingDirectory',{ensure:async()=>root});
 const plugin=await import(pathToFileURL(path.resolve(__dirname,'../lib/plugin.js')).href);await plugin.apply(ctx);
 const names=['generate_character_audio','preview_character_audio','list_voice_profiles','create_voice_profile','check_voice_connection'];
 assert(names.every(n=>tools.schemas().some(t=>t.name===n)));
 const signal=new AbortController().signal;
 const skillConsumer=await load('dsh-tool-skill');skillConsumer.apply(ctx);
 const summaries=await ctx.skills.list();const summary=summaries.find(s=>s.name==='character-voice-director');assert(summary);assert(!Object.hasOwn(summary,'content'));
 const loaded=await tools.execute({callId:'director-skill',name:'skill',arguments:{name:summary.name},signal});assert(loaded.value.content.includes('preview_character_audio'));assert.equal(loaded.isError,false);
 const preview=await tools.execute({callId:'director-preview',name:'preview_character_audio',arguments:{text:'你好。晚安。',performance:[{type:'speech',text:'你好。',controls:['soft']},{type:'sound',event:'breath'},{type:'pause',duration_ms:2000},{type:'speech',text:'晚安。',controls:['whisper']}]},signal});assert(preview.value.success,JSON.stringify(preview));assert.equal(preview.value.paid_requests,2);assert.equal(preview.value.segments[0].pause_after_ms,2000);
 let noKey=await tools.execute({callId:'native-no-key',name:'generate_character_audio',arguments:{text:'晚安。'},signal});
 assert.equal(noKey.value?.error_code,'FISH_KEY_REQUIRED',JSON.stringify(noKey));
 // Native inherited registrations remain visible in each scoped context; PTC SDK sees them.
 const scopes={};
 for(const preset of ['standard','ptc','cordis']){
   const scoped=ctx.extend();const key=createScope(scoped);const agent={ctx:scoped,id:'voice-test-'+preset};
   scopes[preset]=tools.schemas(agent).map(t=>t.name);assert(names.every(n=>scopes[preset].includes(n)));
   assert(names.every(n=>tools.sdkSchemas(agent).some(t=>t.name===n)));
 }
 // Native present validates actual file bytes through a test-only filesystem adapter.
 const {encodeWav,decodeWav}=await import(pathToFileURL(path.resolve(__dirname,'../lib/audio.js')).href);
 const output=path.join(root,'原生交付測試.wav');const pcm=Buffer.alloc(44100*2);for(let i=0;i<44100;i++)pcm.writeInt16LE(Math.round(Math.sin(i/44100*440*2*Math.PI)*3000),i*2);fs.writeFileSync(output,encodeWav(pcm));assert.equal(decodeWav(fs.readFileSync(output)).duration,1);
 const events=[];ctx.provide('sessionProjections',{stateOf(){return {openTurnStartSeq:1,lastTurn:1};}});
 ctx.provide('fs',{async lstat(file){return fs.existsSync(file)?{type:'file'}:undefined;},async resolve(file){return file;},async stat(file){return fs.existsSync(file)?{type:'file'}:undefined;},processPath:file=>file});
 const present=await load('dsh-tool-present');present.apply(ctx,{maxFiles:8});
 const agent={ctx,id:'voice-test-present',session:{append:(kind,data)=>events.push({kind,data})}};
 const delivered=await tools.execute({callId:'native-present',name:'present',arguments:{files:[{path:output,description:'OFFLINE TEST TONE — not cloud speech'}]},agent,signal});
 assert.equal(delivered.isError,false,JSON.stringify(delivered));assert.equal(events[0]?.kind,'deliverables/presented');assert.equal(events[0].data.files[0].path,output);
 fs.writeFileSync(path.join(root,'evidence.json'),JSON.stringify({runtime:'installed DSH 0.2.1-rc.5',scope_test:'synthetic scopes with real registry, not full presets',tool_names:names,no_key:noKey.value,scopes,present:events,audio_duration:1,desktop_ui_verified:false},null,2));
 console.log('PASS installed Skill registry summary without body / native skill tool on-demand load / director schema dispatch and offline preview / Cordis / scoped schemas / PTC SDK / no-key / real present event and valid WAV. Mock session/FS; not live Desktop UI.');
 // No timers, model clients, network listeners or background jobs were started.
})().catch(e=>{console.error(e);process.exitCode=1;});
