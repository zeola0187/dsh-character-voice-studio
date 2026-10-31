import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import renderer,{act} from 'react-test-renderer';
import {createSettingsComponent,inspectSelectedWav} from '../lib/settings-ui.js';import {encodeWav} from '../lib/audio.js';
const Component=createSettingsComponent(React);
const snapshot={success:true,revision:'1',keyConfigured:true,keySource:'local',defaultProfile:'',defaultReferenceId:'',outputDirectory:'',rightsConfirmed:false,allowPaidRequests:false,profiles:[]};
const findButton=(view,label)=>view.root.findAllByType('button').find(b=>b.children.join('')===label);
test('React setting page masks new Key, never prefills old value, saves blank as keep',async()=>{const calls=[];let view;await act(async()=>{view=renderer.create(React.createElement(Component,{api:async q=>{calls.push(q);return snapshot;}}));});const input=view.root.findByProps({'aria-label':'Fish Audio API Key'});assert.equal(input.props.type,'password');assert.equal(input.props.value,'');await act(async()=>{await findButton(view,'儲存設定').props.onClick();});assert.equal(calls.at(-1).keyAction,'keep');assert.equal(calls.at(-1).fishApiKey,undefined);await act(async()=>{input.props.onChange({target:{value:'synthetic-key-only'}});});await act(async()=>{await findButton(view,'儲存設定').props.onClick();});assert.equal(calls.at(-1).keyAction,'replace');assert.equal(calls.at(-1).fishApiKey,'synthetic-key-only');assert.equal(view.root.findByProps({'aria-label':'Fish Audio API Key'}).props.value,'');assert(JSON.stringify(view.toJSON()).includes('已儲存'));view.unmount();});
test('actual React file picker flow stages only, requires consent/name before create, sets default',async()=>{const calls=[];let view;const api=async q=>{calls.push(q);if(q.action==='stage_wav')return {success:true,receipt:{id:'receipt',filename:q.filename,seconds:3,sampleRate:44100,channels:1},notice:'尚未傳給 Fish'};if(q.action==='create_voice')return {...snapshot,defaultProfile:q.name,profiles:[{name:q.name,reference_id:'mock-id'}],notice:'已建立並設為預設'};return snapshot;};await act(async()=>{view=renderer.create(React.createElement(Component,{api}));});const b=encodeWav(Buffer.alloc(44100*3*2,1));const bytes=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);await act(async()=>{await view.root.findByProps({'aria-label':'選擇參考 WAV'}).props.onChange({target:{files:[{name:'我的角色.wav',size:b.length,arrayBuffer:async()=>bytes}],value:'selected'}});});assert.equal(calls.filter(q=>q.action==='create_voice').length,0);assert(findButton(view,'建立私人聲線並設為預設').props.disabled);await act(async()=>{view.root.findByProps({'aria-label':'角色名稱'}).props.onChange({target:{value:'我的角色'}});const checkboxes=view.root.findAllByType('input').filter(i=>i.props.type==='checkbox');checkboxes[2].props.onChange({target:{checked:true}});});assert.equal(findButton(view,'建立私人聲線並設為預設').props.disabled,false);await act(async()=>{await findButton(view,'建立私人聲線並設為預設').props.onClick();});assert(calls.at(-1).confirmUpload&&calls.at(-1).confirmRights&&calls.at(-1).confirmCost);assert.equal(view.root.findByProps({'aria-label':'預設角色'}).props.value,'我的角色');view.unmount();});
test('browser WAV preflight validates bytes and duration without an absolute path',()=>{const b=encodeWav(Buffer.alloc(44100*3*2));assert.equal(inspectSelectedWav(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)).seconds,3);assert.throws(()=>inspectSelectedWav(new ArrayBuffer(50)));});
test('React Key removal requires confirmation and sends clear only once',async()=>{
  const calls=[];let view;const original=globalThis.confirm;
  try{
    await act(async()=>{view=renderer.create(React.createElement(Component,{api:async q=>{calls.push(q);return {...snapshot,keyConfigured:q.action==='save'?false:true};}}));});
    globalThis.confirm=()=>false;
    await act(async()=>{await findButton(view,'移除 Key').props.onClick();});
    assert.equal(calls.filter(q=>q.action==='save').length,0);
    globalThis.confirm=()=>true;
    await act(async()=>{await findButton(view,'移除 Key').props.onClick();});
    assert.equal(calls.filter(q=>q.action==='save').length,1);
    assert.equal(calls.at(-1).keyAction,'clear');
    assert.equal(findButton(view,'移除 Key').props.disabled,true);
  }finally{globalThis.confirm=original;view?.unmount();}
});
