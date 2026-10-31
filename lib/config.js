import { readFile, mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { fail } from './errors.js';
export function configPath() { return process.env.DSH_CHARACTER_VOICE_CONFIG || path.join(os.homedir(),'.dsh-character-voice-studio','config.json'); }
export async function readStoredConfig(file=configPath()) {
  let c={};try{c=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')fail('CONFIG_INVALID','本機 Character Voice 設定不是有效 JSON。');}
  if(!c || typeof c!=='object' || Array.isArray(c))fail('CONFIG_INVALID','設定必須是 JSON object。');
  for(const field of ['fishApiKey','defaultProfile','defaultReferenceId','outputDirectory'])if(c[field]!==undefined && typeof c[field]!=='string')fail('CONFIG_INVALID',`設定 ${field} 必須是字串。`);
  return c;
}
export async function readConfig(file=configPath()) {
  const c=await readStoredConfig(file);
  return {...c,fishApiKey:c.fishApiKeyDisabled?'':(c.fishApiKey || process.env.FISH_API_KEY || ''),defaultFormat:c.defaultFormat||'wav',timeoutMs:Math.max(1000,Math.min(180000,Number(c.timeoutMs)||120000)),dataRoot:path.dirname(path.resolve(file))};
}
export function requireCloud(c,upload=false) {
  if(!c.fishApiKey)fail('FISH_KEY_REQUIRED','請開啟 DSH「設定 → 角色語音」，填入 Fish Audio API Key 並儲存；不要把 Key 貼在對話。');
  if(c.rightsConfirmed!==true)fail('RIGHTS_CONFIRMATION_REQUIRED','請先在本機設定確認擁有必要聲音使用權限。');
  if(c.allowPaidRequests!==true)fail('COST_CONFIRMATION_REQUIRED','請先在本機設定同意 Fish 雲端請求與可能費用。');
  if(upload && c.allowReferenceUpload!==true)fail('UPLOAD_CONFIRMATION_REQUIRED','請先在本機設定允許將指定參考 WAV 上傳 Fish Audio。');
}
export async function atomicWrite(file,bytes) {
  await mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+randomUUID()+'.tmp';
  try {await writeFile(tmp,bytes,{flag:'wx',mode:0o600});await rename(tmp,file);}finally{await unlink(tmp).catch(()=>{});}
}
export async function profiles(c) {
  try {const p=JSON.parse(await readFile(path.join(c.dataRoot,'profiles.json'),'utf8'));if(!Array.isArray(p))throw Error();return p;}catch(e){if(e.code==='ENOENT')return [];fail('PROFILES_INVALID','聲線清單無效，請檢查本機 profiles.json。');}
}
export async function saveProfile(c,profile) {
  const all=await profiles(c);if(all.some(p=>p.name===profile.name))fail('PROFILE_EXISTS','此名稱已存在，請選新聲線名稱。');
  all.push(profile);await atomicWrite(path.join(c.dataRoot,'profiles.json'),JSON.stringify(all,null,2));return profile;
}
