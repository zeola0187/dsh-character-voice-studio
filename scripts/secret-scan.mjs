import {execFileSync} from 'node:child_process';import {readFile} from 'node:fs/promises';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=/(^|\/)(?:config\.json|profiles\.json|\.env(?:\..*)?|generated_audio|test-output|node_modules|\.local)(?:\/|$)|\.(?:wav|mp3|flac|pcm|ogg)$/i;
const secrets=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{40,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/"fishApiKey"\s*:\s*"(?!"|test-fixture)[^"]{16,}"/];
for(const file of files){if(forbidden.test(file)&&!file.endsWith('config.example.json'))throw Error('Forbidden tracked file: '+file);const s=await readFile(file,'utf8');if(secrets.some(p=>p.test(s)))throw Error('Potential credential in '+file);}
console.log(`PASS tracked-file secret/privacy scan: ${files.length} files; no credentials, private config or audio tracked.`);
