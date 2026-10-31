import { defineTool } from '@deepseek-ai/dsh-tools';
import { VoiceStudio } from './service.js';
export const name='character-voice-studio';
export const inject=['tools','workingDirectory'];
const studio=new VoiceStudio();
const str=(description,required=false)=>({type:'string',description,...(required?{required:true}:{})});
const output={schema:{type:'object',additionalProperties:true},render:(_a,v)=>[{type:'text',text:JSON.stringify(v)}]};
export function apply(ctx){
  const context=async exec=>({signal:exec.signal,cwd:exec.agent?await ctx.workingDirectory.ensure(exec.agent,exec.signal):undefined});
  ctx.tools.register(defineTool({name:'generate_character_audio',description:'生成角色語音檔案，Fish Drama 3 雲端（可能計費）。使用者要求照念時必須逐字保留 text；若要求撰稿，由 DSH 先撰稿。自然語言表演指示放 direction，不可放台詞。精確停頓用 segments 的 pause_before_ms / pause_after_ms；各段 text 連接必須等於完整 text。成功後務必呼叫 present 交付 file_path。不是播放工具。沒有本機 Key/權利/費用確認時會提示設定，勿代替使用者同意。',parameters:{text:str('最終要念的完整原文。',true),direction:str('自然語言表演指示，不要自行加標籤。'),voice_profile:str('已保存聲線名稱或 reference_id；省略使用設定預設。'),format:{type:'string',enum:['wav','mp3'],description:'預設 wav；首版 mp3 會明確回報尚未啟用。'},output_name:str('不含資料夾的檔名。'),segments:{type:'array',items:{type:'object',additionalProperties:false,properties:{text:str('本段台詞',true),direction:str('本段語氣；省略沿用主語氣'),pause_before_ms:{type:'integer'},pause_after_ms:{type:'integer'}}}}},output,timeoutMs:600000,async execute(a,e){return studio.generate(a,await context(e));}}));
  ctx.tools.register(defineTool({name:'list_voice_profiles',description:'列出本機聲線與設定就緒狀態，不回傳 Key；不連線。',parameters:{},output,execute:()=>studio.list()}));
  ctx.tools.register(defineTool({name:'create_voice_profile',description:'匯入既有 Fish reference_id（不連線），或上傳使用者明確指定且有權使用的乾淨 WAV 建立 private 聲線。不得自行搜尋私人音訊。雲端上傳需使用者在本機設定同意權利、費用與上傳。name 必須是新名稱。',parameters:{name:str('聲線名稱',true),path:str('使用者指定的乾淨 WAV 路徑；與 reference_id 擇一。'),reference_id:str('既有 Fish voice ID，不需重新上傳'),transcript:str('可選參考音檔逐字稿')},output,timeoutMs:180000,async execute(a,e){return studio.create(a,await context(e));}}));
  ctx.tools.register(defineTool({name:'check_voice_connection',description:'使用 Fish GET /model 檢查預設聲線的認證與狀態；不生成語音。仍須使用者先啟用雲端設定。',parameters:{},output,timeoutMs:180000,execute:(_a,e)=>studio.check({signal:e.signal})}));
}
