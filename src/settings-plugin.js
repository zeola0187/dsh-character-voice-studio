import {Remote,TypertRemoteService,principalOf} from '@deepseek-ai/dsh-typert-protocol';
import {SettingsStore} from './settings-store.js';
import {resultError} from './errors.js';
const initializers=[];
export const name='character-voice-settings';
export const inject=[];
export class CharacterVoiceSettings extends TypertRemoteService{
  constructor(ctx){super(ctx,'characterVoiceSettings');this.store=new SettingsStore();for(const initialize of initializers)initialize.call(this);}
  async command(request){
    // No model tool exposes this RPC. Shared/remote principals cannot modify or read settings.
    if(!this.ctx.invocation||this.ctx.invocation.peer?.principal?.kind!=='owner'||principalOf(this.ctx.invocation)!==undefined)return JSON.stringify({success:false,error_code:'OWNER_REQUIRED',error_message:'只有透過 DSH 設定介面的擁有者連線可管理聲線與憑證。'});
    if(typeof request!=='string'||request.length>28*1024*1024)return JSON.stringify({success:false,error_code:'SETTINGS_INPUT_INVALID',error_message:'設定請求過大。'});
    try{return JSON.stringify(await this.store.command(JSON.parse(request)));}catch(e){return JSON.stringify(resultError(e));}
  }
}
Remote('command')(CharacterVoiceSettings.prototype.command,{kind:'method',name:'command',static:false,private:false,addInitializer:fn=>initializers.push(fn)});
export function apply(ctx){new CharacterVoiceSettings(ctx);}
