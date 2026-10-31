// Official CLI overlay for an isolated base + voice bundle profile. No Desktop or Fish interaction.
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';import assert from 'node:assert/strict';import React from 'react';import {z} from 'zod';
export const name='voice-settings-profile-probe';
export const inject=['tools','characterVoiceSettings','clientModules','typertGateway','typert'];
export function apply(ctx){void (async()=>{
  const graph=ctx.clientModules.graph(),entry=graph.entries.find(e=>e.id==='dsh-character-voice-studio');assert(entry,'No client entry in real Host module graph');assert.equal(entry.immediately,true);
  const deadline=Date.now()+10000;
  while(!ctx.typert.local.get('characterVoiceSettings/command')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));
  assert(ctx.typert.local.get('characterVoiceSettings/command'),'Host must mount the strict settings descriptor');
  assert(entry.inject.includes('@deepseek-ai/dsh-client-ui-settings'));
  let bootstrap;const facade={mode:'queue',pendingQueue:[],load(r){if(r.id==='@deepseek-ai/dsh-client-modules')bootstrap=r;else this.pendingQueue.push(r);}};
  const sandbox=vm.createContext({window:{__ModuleLoader__:facade},console,URL,TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout});
  vm.runInContext(await readFile(ctx.clientModules.clientPath('@deepseek-ai/dsh-client-modules'),'utf8'),sandbox);
  const kernel=bootstrap.factory(()=>{throw Error('Unexpected bootstrap require');});
  const modules=kernel.createClientModuleSystem(facade,{id:bootstrap.id,exports:kernel},{boot:graph,staticModules:{react:React,zod:{z}},loadBundle:async url=>{const response=await ctx.clientModules.fetchBundle(new Request(new URL(url,'http://voice-test.local/')));assert.equal(response.status,200);vm.runInContext(await response.text(),sandbox);}});
  const client=await modules.import('dsh-character-voice-studio');assert.equal(typeof client.apply,'function');
  const slots=[],dictionaries=[];let wire;
  const peer={principal:{kind:'owner'},signal:new AbortController().signal};
  const ownerCall=request=>ctx.typertGateway.dispatchRpc('characterVoiceSettings/command',{args:{request}},undefined,peer);
  const mockClient={get:()=>undefined,effect:fn=>fn(),locale:{register:(ns,dict)=>{dictionaries.push({ns,dict});return()=>{};},bind:()=>()=> '角色語音'},slots:{inject:(_name,fn)=>fn(),register:(options,component)=>{slots.push({options,component});return()=>{};}},remote:{$mount:async w=>{wire=w;return()=>{};},characterVoiceSettings:{command:ownerCall}},inject:(_deps,fn)=>fn(mockClient)};
  await client.apply(mockClient);assert.equal(slots.length,2);assert(slots.some(s=>s.options.name==='settings.section'&&s.options.id==='character-voice'));assert(slots.some(s=>s.options.name==='plugins.bundle.config'&&s.options.key==='dsh-character-voice-studio'));assert.equal(dictionaries[0].dict.zh.title,'角色語音');
  const api=slots[0].options.inject().api;const first=await api({action:'get'});assert.equal(first.keyConfigured,false);
  const saved=await api({action:'save',revision:first.revision,keyAction:'replace',fishApiKey:'synthetic-native-settings-key',defaultProfile:'',defaultReferenceId:'',outputDirectory:'',defaultFormat:'wav',rightsConfirmed:false,allowPaidRequests:false});assert(saved.keyConfigured);assert(!JSON.stringify(saved).includes('synthetic-native-settings-key'));
  const cleared=await api({action:'save',revision:saved.revision,keyAction:'clear',defaultProfile:'',defaultReferenceId:'',outputDirectory:'',defaultFormat:'wav',rightsConfirmed:false,allowPaidRequests:false});assert.equal(cleared.keyConfigured,false);
  const command=Object.getPrototypeOf(ctx.characterVoiceSettings).command;
  const denied=JSON.parse(await command.call({ctx:{invocation:{peer:{principal:{kind:'shared',id:'not-owner'}}}},store:{command(){throw Error('Must never access store');}}},JSON.stringify({action:'get'})));assert.equal(denied.error_code,'OWNER_REQUIRED');
  assert.equal(JSON.parse(await ctx.characterVoiceSettings.command('{"action":"get"}')).error_code,'OWNER_REQUIRED');
  assert.equal(wire.descriptors[0].namespace,'characterVoiceSettings');assert(wire.descriptors[0].parameters[0].codec.create().safeParse('{}').success);
  const evidence={success:true,hostModuleGraphEntry:entry,clientAsset:ctx.clientModules.clientPath('dsh-character-voice-studio'),actualModuleLoaderMaterialized:true,actualGatewayDispatch:true,registeredSlots:slots.map(s=>({name:s.options.name,id:s.options.id||s.options.key})),dictionary:true,keyRoundtrip:'save/get/clear redacted',nonOwnerDenied:true,desktopTouched:false,fishCalls:0,modelCalls:0};
  await writeFile(process.env.DSH_VOICE_SETTINGS_PROBE_RESULT,JSON.stringify(evidence,null,2));console.log('VOICE_SETTINGS_PROFILE_PROBE_PASS');process.exit(0);
})().catch(e=>{console.error('VOICE_SETTINGS_PROFILE_PROBE_FAIL',e.message);process.exit(1);});}
