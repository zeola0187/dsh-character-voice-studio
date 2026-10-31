import { fail } from './errors.js';
// Explicit extension boundary. No endpoint, schema, credentials, or GPU rental is inferred.
export class CloudVoxCPMProvider {
  constructor(config){this.config=config;}
  async generateCleanReference(_request,_signal){
    if(!this.config?.endpoint)fail('VOXCPM_NOT_CONFIGURED','尚未設定 VoxCPM2 雲端端點；Fish WAV 匯入路徑仍可獨立使用。');
    fail('VOXCPM_ADAPTER_REQUIRED','已填端點但尚未驗證該服務 schema。需依服務官方文件實作 adapter 後才可呼叫。');
  }
}
