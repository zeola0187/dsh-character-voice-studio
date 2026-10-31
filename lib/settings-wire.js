export function settingsWire(z){
  const input={mode:'strict',typeSymbol:'dsh-character-voice-studio#SettingsCommand',create:()=>z.string().max(28*1024*1024),jsonSchema:{type:'string',maxLength:28*1024*1024}};
  const output={mode:'strict',typeSymbol:'dsh-character-voice-studio#SettingsResult',create:()=>z.string().max(256000),jsonSchema:{type:'string',maxLength:256000}};
  return {package:'dsh-character-voice-studio',descriptors:[{id:'dsh-character-voice-studio#characterVoiceSettings/command',namespace:'characterVoiceSettings',method:'command',service:'characterVoiceSettings',invocation:{kind:'direct'},parameters:[{name:'request',wire:'request',source:'json',codec:input,strictCodec:input}],result:output}]};
}
