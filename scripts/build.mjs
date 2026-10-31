import {mkdir,readdir,copyFile,writeFile} from 'node:fs/promises';
import {settingsWire} from '../src/settings-wire.js';
import {inspectSelectedWav,bytesToBase64,createSettingsComponent} from '../src/settings-ui.js';
import {clientEntry} from '../src/client-entry.js';
await mkdir('lib',{recursive:true});
for(const name of await readdir('src'))if(name.endsWith('.js'))await copyFile('src/'+name,'lib/'+name);
await writeFile('lib/client.js',`window.__ModuleLoader__.load({id:'dsh-character-voice-studio',factory(require){\nconst React=require('react'),z=require('zod').z;\n${settingsWire}\n${inspectSelectedWav}\n${bytesToBase64}\n${createSettingsComponent}\n${clientEntry}\nreturn clientEntry(React,z,settingsWire,createSettingsComponent);\n}});\n`);
console.log('Executable ESM JavaScript copied to lib; no install-time build or native dependency.');
