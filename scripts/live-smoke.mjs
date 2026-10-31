import {VoiceStudio} from '../lib/service.js';
// Explicit user-run paid test only; never runs in npm test or during install.
if(!process.argv.includes('--confirm-paid')){console.error('先執行 setup.cmd，確認權利／費用，然後執行 npm run smoke:live -- --confirm-paid。');process.exitCode=2;}else{
  const studio=new VoiceStudio();
  const result=await studio.generate({text:'今天辛苦了。晚安。',direction:'溫柔、慢速、略帶疲憊',segments:[{text:'今天辛苦了。'},{text:'晚安。',pause_before_ms:2000}],output_name:'雲端驗收'},{cwd:process.cwd()});
  console.log(JSON.stringify(result,null,2));if(!result.success)process.exitCode=1;
}
