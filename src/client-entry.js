// Emitted inside the ModuleLoader factory by build.mjs. No private configuration is bundled.
export function clientEntry(React,z,settingsWire,createSettingsComponent){
  const Settings=createSettingsComponent(React);
  const dictionaries={en:{title:'Character Voice'},zh:{title:'角色語音'}};
  return {inject:['slots','remote','locale'],async apply(ctx){
    const unmount=await ctx.remote.$mount(settingsWire(z));ctx.effect(()=>unmount,'Character Voice settings RPC');
    ctx.effect(()=>ctx.locale.register('characterVoice',dictionaries),'Character Voice dictionaries');
    const t=ctx.locale.bind('characterVoice');
    ctx.inject(['remote.characterVoiceSettings'],scoped=>{
      const api=async q=>{
        let response;try{response=await scoped.remote.characterVoiceSettings.command(JSON.stringify(q));}catch{throw {safeMessage:'設定連線中斷；請重新載入。若正在建立聲線，請先檢查 Fish 帳號，勿盲目重送。'};}
        if(!response.ok)throw {safeMessage:'設定服務無法完成請求，請確認連線及擁有者權限。'};
        let value;try{value=JSON.parse(response.value);}catch{throw {safeMessage:'設定服務回應格式無效。'};}
        if(!value.success)throw {safeMessage:(value.error_message||'設定操作失敗。')+(value.error_code==='PROFILE_SAVE_FAILED'&&value.profile?.reference_id?' 恢復用 reference_id：'+value.profile.reference_id:''),code:value.error_code};return value;
      };
      const injected=()=>({api,pickDirectory:scoped.get('uiWorkspace')?()=>scoped.uiWorkspace.pickDirectory():undefined});
      scoped.slots.inject('settings.section',()=>scoped.slots.register({name:'settings.section',id:'character-voice',order:16,label:()=>t('title'),locale:'characterVoice',inject:injected},Settings));
      scoped.slots.inject('plugins.bundle.config',()=>scoped.slots.register({name:'plugins.bundle.config',key:'dsh-character-voice-studio',inject:injected},Settings));
    });
  }};
}
