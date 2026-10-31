import {VoiceStudio} from '../lib/service.js';
import path from 'node:path';
// Explicit user-run paid test only; never runs in npm test or during install.
if(!process.argv.includes('--confirm-paid')){console.error('先執行 setup.cmd，確認權利／費用，再從使用者工作區執行此腳本 --confirm-paid，或加 --workspace 絕對工作區路徑。');process.exitCode=2;}else{
  const studio=new VoiceStudio();
  const i=process.argv.indexOf('--workspace');
  if(i>=0&&!process.argv[i+1])throw Error('--workspace requires a path');
  const cwd=i<0?process.cwd():path.resolve(process.argv[i+1]);
  const result=await studio.generate({text:'今天辛苦了。晚安。',direction:'溫柔、慢速、略帶疲憊',segments:[{text:'今天辛苦了。'},{text:'晚安。',pause_before_ms:2000}],output_name:'雲端驗收'},{cwd});
  console.log(JSON.stringify(result,null,2));if(!result.success)process.exitCode=1;
}
