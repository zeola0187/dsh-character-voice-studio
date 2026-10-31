// Offline engineering check, not a proof that arbitrary secrets are absent.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const forbidden=/(^|\/)(?:config\.json|profiles\.json|\.env(?:\..*)?|generated_audio|test-output|node_modules|\.local)(?:\/|$)|\.(?:wav|mp3|flac|pcm|ogg|bin|log|tgz)$/i;
const rules={
  credential:/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:sk-|sk_)[A-Za-z0-9]{24,}/,
  privatePath:/(?:[A-Za-z]:[\\/](?:Users|AI)[\\/][^\s'"`<>]+|\/home\/[^\s'"`<>]+|\/Users\/[^\s'"`<>]+)/,
  literalKey:/["']?(?:fishApiKey|api_key|apiKey)["']?\s*[:=]\s*["'](?!["']|test|fixture|fake|mock|sample|example|replace|synthetic-)[A-Za-z0-9_-]{20,}["']/,
  credentialUrl:/https?:\/\/[^\s/@]+:[^\s/@]+@/,
  embeddedAudio:/data:audio\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/
};
let blobs=0;const failures=[];
function scan(label,b){
  if(b.includes(0)||b.toString('ascii',0,4)==='RIFF')failures.push({label,kind:'binary'});
  b.toString('utf8').split(/\r?\n/).forEach((line,i)=>{for(const [kind,rule]of Object.entries(rules))if(rule.test(line))failures.push({label,line:i+1,kind});});
}
const objects=git('rev-list','--objects','--all').toString().trim().split('\n');
const commits=git('rev-list','--all').toString().trim().split('\n');
for(const commit of commits){
  for(const row of git('ls-tree','-r','-z',commit).toString().split('\0').filter(Boolean)){
    const [meta,path]=row.split('\t');
    if(forbidden.test(path))failures.push({label:commit+':'+path,kind:'forbidden-tree-path'});
    if(!meta.startsWith('100644 blob ')&&!meta.startsWith('100755 blob '))failures.push({label:commit+':'+path,kind:'nonregular-entry'});
  }
}
for(const row of objects){
  const [id,...rest]=row.split(' '),path=rest.join(' ');
  const type=git('cat-file','-t',id).toString().trim();
  if(type==='blob'){blobs++;if(forbidden.test(path))failures.push({label:path,kind:'forbidden-history-path'});scan(id+':'+path,git('cat-file','blob',id));}
  else if(type==='commit'||type==='tag')scan(id+':'+type,git('cat-file',type,id));
}
const files=[...new Set(git('ls-files','--cached','--others','--exclude-standard','-z').toString().split('\0').filter(Boolean))];
for(const file of files){if(forbidden.test(file))failures.push({label:file,kind:'forbidden-working-path'});scan(file,readFileSync(file));}
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}
else console.log(JSON.stringify({pass:true,commits:commits.length,historicalBlobs:blobs,workingFiles:files.length,scope:'all local refs, every commit tree/path, commit/tag messages, historical blobs, tracked and nonignored working files; exact synthetic test markers excluded'}));
