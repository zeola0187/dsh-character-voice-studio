import {mkdir,readdir,copyFile} from 'node:fs/promises';
await mkdir('lib',{recursive:true});
for(const name of await readdir('src'))if(name.endsWith('.js'))await copyFile('src/'+name,'lib/'+name);
console.log('Executable ESM JavaScript copied to lib; no install-time build or native dependency.');
