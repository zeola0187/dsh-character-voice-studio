import {readdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const p=JSON.parse(await readFile('package.json','utf8'));assert(!p.scripts.prepare);assert(p.dsh.bundle.patch);assert(p.engines.dsh==='0.2.1-rc.5');
for(const n of await readdir('src'))if(n.endsWith('.js'))assert((await readFile('src/'+n)).equals(await readFile('lib/'+n)),`Stale lib/${n}`);
console.log('Package metadata and committed executable lib match source.');
