import {fail} from './errors.js';

export const CONTROLS=Object.freeze(['whisper','emphasis','soft','fast','slow','stress','forceful']);
export const SOUNDS=Object.freeze({breath:'breath',sigh:'sigh',chuckle:'soft chuckle',laugh:'laugh'});
export const LIMITS=Object.freeze({nodes:100,sounds:20,controls:1,requests:20,text:6000,segmentText:1500,pause:30000,totalPause:120000,scriptBytes:24000,totalScriptBytes:48000});
const bad=(message)=>fail('INVALID_PERFORMANCE',message);
const plain=(value,max,required=false)=>{
  if(typeof value!=='string'||value.length>max||(required&&!value.trim()))bad('表演文字格式或長度不符限制。');
  if(/[\[\]<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)||!value.isWellFormed())bad('表演文字不可包含原始標籤、控制字元或無效 Unicode。');
  return value;
};
function fields(node,allowed){
  if(!node||typeof node!=='object'||Array.isArray(node)||Object.keys(node).some(k=>!allowed.includes(k)))bad('節點含不支援欄位。');
}

// Pure compiler. Only allowlisted controls become markup; literal dialogue is never parsed as markup.
export function compilePerformance(text,performance,direction=''){
  plain(text,LIMITS.text,true);plain(direction,500);
  if(!Array.isArray(performance)||!performance.length||performance.length>LIMITS.nodes)bad('performance 必須有 1–100 個節點。');
  const segments=[];let literal='',sounds=0,totalPause=0,totalBytes=0;
  let current={text:'',script:'',pause_before_ms:0,pause_after_ms:0};
  const flush=()=>{
    if(!current.script)return;
    if(!current.text.trim())bad('每個精確停頓隔開的請求必須包含台詞，不能只有聲音事件。');
    if(current.text.length>LIMITS.segmentText)bad('每個請求的台詞上限為 1500 字元；請先明確安排分段。');
    const script=(direction?`[${direction}]`:'')+current.script,bytes=Buffer.byteLength(script,'utf8');
    if(bytes>LIMITS.scriptBytes||(totalBytes+=bytes)>LIMITS.totalScriptBytes)bad('編譯後 Fish 腳本超過 UTF-8 位元組預算。');
    segments.push({...current,script,direction:''});
    if(segments.length>LIMITS.requests)bad('最多允許 20 個付費請求。');
    current={text:'',script:'',pause_before_ms:0,pause_after_ms:0};
  };
  for(const node of performance){
    if(node?.type==='speech'){
      fields(node,['type','text','direction','controls']);
      const words=plain(node.text,LIMITS.segmentText);if(!words.length)bad('speech text 不可為空。');
      const style=node.direction===undefined?'':plain(node.direction,500);
      const controls=node.controls===undefined?[]:node.controls;
      if(!Array.isArray(controls)||controls.length>LIMITS.controls||new Set(controls).size!==controls.length||controls.some(c=>!CONTROLS.includes(c)))bad('不支援、重複或過多的局部控制。');
      // A single paired tag per span: nesting behavior is not documented by Fish.
      let span=words;if(controls.length)span=`<${controls[0]}>${span}</${controls[0]}>`;
      current.script+=(style?`[${style}]`:'')+span;current.text+=words;literal+=words;
    }else if(node?.type==='sound'){
      fields(node,['type','event']);
      if(typeof node.event!=='string'||!Object.hasOwn(SOUNDS,node.event)||++sounds>LIMITS.sounds)bad('不支援的聲音事件或超過 20 個事件。');
      current.script+=`[${SOUNDS[node.event]}]`;
    }else if(node?.type==='pause'){
      fields(node,['type','duration_ms']);const ms=node.duration_ms;
      if(!Number.isInteger(ms)||ms<0||ms>LIMITS.pause||(totalPause+=ms)>LIMITS.totalPause)bad('停頓需為 0–30000 毫秒整數，總計最多 120 秒。');
      if(ms===0)continue;
      if(current.script){current.pause_after_ms+=ms;flush();}
      else if(segments.length)segments.at(-1).pause_after_ms+=ms;
      else current.pause_before_ms+=ms;
    }else bad('未知的表演節點類型。');
  }
  flush();
  if(literal!==text)fail('TEXT_PERFORMANCE_MISMATCH','所有 speech.text 必須逐字串接為 text，包含空白、標點與 Unicode；不得改寫。');
  if(!segments.length)bad('表演計畫缺少台詞。');
  return segments;
}

export const performanceSchema={type:'array',minItems:1,maxItems:LIMITS.nodes,description:'結構化表演節點；與 segments 互斥。speech.text 逐字串接必須等於 text。局部控制不增加請求；只有正值 pause 才切段。',items:{oneOf:[
  {type:'object',additionalProperties:false,required:['type','text'],properties:{type:{const:'speech'},text:{type:'string',minLength:1,maxLength:1500},direction:{type:'string',maxLength:500},controls:{type:'array',maxItems:1,uniqueItems:true,items:{type:'string',enum:CONTROLS}}}},
  {type:'object',additionalProperties:false,required:['type','event'],properties:{type:{const:'sound'},event:{type:'string',enum:Object.keys(SOUNDS)}}},
  {type:'object',additionalProperties:false,required:['type','duration_ms'],properties:{type:{const:'pause'},duration_ms:{type:'integer',minimum:0,maximum:30000}}}
]}};

// rc.5 defineTool takes its value-schema DSL, not arbitrary JSON Schema keywords.
// Full numeric/length constraints remain in the public JSON Schema and runtime validator.
function toToolSchema(schema){
  const result={};
  for(const key of ['type','description','enum','const','additionalProperties'])if(Object.hasOwn(schema,key))result[key]=schema[key];
  if(Object.hasOwn(schema,'const')&&!result.type)result.type=typeof schema.const;
  if(schema.properties)result.properties=Object.fromEntries(Object.entries(schema.properties).map(([key,value])=>[key,{...toToolSchema(value),...(schema.required?.includes(key)?{required:true}:{})}]));
  if(schema.items)result.items=toToolSchema(schema.items);
  if(schema.oneOf)result.oneOf=schema.oneOf.map(toToolSchema);
  return result;
}
export const performanceToolSchema=toToolSchema(performanceSchema);
