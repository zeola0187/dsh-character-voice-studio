# DSH Character Voice Studio

> 此功能分支為 **0.2.0-dev.1 — AI Voice Director** 開發候選版。使用 `github:zeola0187/dsh-character-voice-studio#feat/voice-director-v02` 測試，或固定完整 commit SHA；穩定 `v0.1.0` 不包含本功能。既有安裝不會自動更新。

新增隨插件提供、按需載入的 `character-voice-director` Skill：直接描述語氣、局部耳語/速度/重讀、呼吸/嘆息/笑聲與精確停頓，不需要手寫 Fish 標籤。新增免費離線 `preview_character_audio` 預覽；舊版生成、聲線設定與 WAV 交付保留。詳見 [功能契約、限制、安裝與三組自然語言測試](VOICE-DIRECTOR.md)。離線及原生隔離測試通過，不代表真實模型表演已驗收；真實付費生成仍待使用者確認。

DSH 原生插件：自然語言台詞與表演指示 → Fish Audio Drama 3 → 有效 WAV → DSH `present` 檔案交付。沒有第二個 LLM、播放器、麥克風或本機 GPU 推論。

正式版 **0.1.0**，以 MIT 授權發布。使用者已確認插件驗收通過；封版維持 rc.4 的生成邏輯，另完成離線回歸與公開前授權／隱私檢查。驗證範圍見 [TEST-RESULTS.md](TEST-RESULTS.md)，交接見 [HANDOFF.md](HANDOFF.md)。

## 安裝

支援已核實的 **DSH 0.2.1-rc.5**。開啟 **插件管理 → 添加插件 → 包名或地址**，直接貼上專案首頁，再按安裝：

```text
https://github.com/zeola0187/dsh-character-voice-studio
```

首頁是一般使用者的正式安裝入口，不需要抄 `github:` 或 tag。DSH 將它辨識為 Git 來源，交給套件管理器解析預設分支。**目前預設分支是 main，版本為 0.1.0（含中文頁名）；不包含尚待驗收的 Voice Director 0.2.0-dev.1。** 待驗收並正式合併 main 後，新安裝才會取得新版；沒有為此改變預設分支。

只有測試開發版時才使用 `github:zeola0187/dsh-character-voice-studio#feat/voice-director-v02`。需要重現歷史版本的進階使用者仍可固定 tag 或 commit SHA。公開倉庫下載不需要本插件提供任何 GitHub Token。包含已編譯後端 JS 與 lib/client.js；Git 安裝不執行 build/prepare，不下載模型或原生音訊依賴。

**更新既有 Git 插件：** rc.5 沒有一般 Git 插件的升級按鈕；依管理頁提示先移除此插件，再用上面的首頁網址安裝。已辨識為安裝中的同一來源會遭到拒絕；改用另一種網址拼法也不是可靠的更新方式。安裝會保存解析結果與 lockfile，不能把重貼首頁、重新開啟 DSH 或 GitHub push 當成已更新。正常移除插件不刪除使用者目錄中的本插件 Key／聲線設定；不要手動刪除該資料目錄。自訂設定或輸出若放在套件目錄內則不在這項保留保證內。

官方 CLI 備用方式（DSH CLI 需在 PATH，profile 換成實際名稱；一般使用者使用圖形介面即可）：

```powershell
dsh plugin --profile desktop add 'https://github.com/zeola0187/dsh-character-voice-studio'
```

既有 Git 安裝與設定模組曾在隔離 profile 實測；本次封版不代為更新正式 profile。其他 DSH 版本、平台及重新安裝後的實際前端狀態需另驗。

## 第一次使用：在 DSH 設定完成

**安裝後若「角色語音」設定頁未出現，請重新開啟 DSH。** 安裝成功與目前前端已重新載入是兩回事；既有 Key／聲線設定的儲存則立即生效，不需每次重開。本次交付不會代替您更新或重啟 DSH。

1. 開啟 **設定 → 角色語音**。插件管理器中此插件的設定區也使用同一頁。
2. 輸入 **Fish Audio API Key**，本人確認素材使用權與可能費用，再按「儲存設定」。既有 Key 只顯示已設定，不回填原值；留空儲存會保留，另按「移除 Key」才會刪除。設定立即生效。
3. 按 **選擇 WAV**，用系統選檔視窗選乾淨人聲：**PCM16 WAV、3–120 秒、20MB 以下，單／雙聲道**。選檔只驗證並暫存副本到連線的 DSH 主機，**不會傳給 Fish**，不改原檔。
4. 填角色名稱，例如「溫柔晚安角色」。本人確認這段聲音的使用權、這次上傳與可能費用，按 **建立私人聲線並設為預設**。Fish 會收到該 WAV；建立使用 `visibility=private`、`generate_sample=false`。
5. 回 DSH 直接說台詞、語氣和停頓需求。成功後交付 WAV，可下載或用系統播放器開啟。

不需要知道路徑、reference ID 或 JSON。已有 Fish 聲線可在「進階」輸入名稱與 ID 匯入，這一步不呼叫 Fish。預設輸出目前 DSH 工作區的 `generated_audio`；進階可改資料夾。聲線下拉選單可換預設。

GUI 建立成功會保存聲線、設為預設，並記錄本人允許後續按其指令生成與可能費用；**不會開放模型任意上傳其他 WAV**。刪除本機聲線記錄不刪原始 WAV 或 Fish 遠端聲線。

原生設定使用 rc.5 官方 settings.section、plugins.bundle.config、ModuleLoader 和 Typert RPC。`setup.cmd`／`setup.ps1` 僅保留作進階排障備用。

## 三句對話範例

1. 請用預設角色，逐字說出「你好，很高興見到你。」，不要添加語氣，生成 WAV 並交付檔案。
2. 請用預設角色，以溫柔、慢速、略帶疲倦的語氣，逐字說出「今天辛苦了。先把肩膀放鬆，好嗎？晚安。」。表演指示放 direction，不要當台詞念，生成 WAV 並交付檔案。
3. 請用預設角色溫柔地說「今天辛苦了。晚安。」，分成「今天辛苦了。」和「晚安。」兩段，第二段之前額外插入精確兩秒靜音，第一段不要重複加停頓，生成 WAV 並交付檔案。

DSH 負責理解自然語言與分段。自訂語氣由 `direction` 轉成 Fish Drama 3 的 `[語氣]台詞`。模型效果仍需真人聆聽，不能保證任意指令都完全實現。

## 本機資料與權限

資料位於 DSH 主機使用者目錄：

```text
%USERPROFILE%\.dsh-character-voice-studio\config.json
%USERPROFILE%\.dsh-character-voice-studio\profiles.json
%USERPROFILE%\.dsh-character-voice-studio\imports\
```

imports 保存所選 WAV 副本，成功建立或按移除選檔時清除該副本。關閉頁面、中斷或不確定失敗可能留下副本，可由本人在該目錄清理，不影響原檔。選檔回執只有檔名與音訊資訊，私人絕對路徑不傳給 LLM。

Key 保存本機設定，**不是 OS 密碼庫加密儲存**，請保護該使用者帳號。設定 RPC 僅接受 DSH owner 連線；回應、工具、LLM 提示與日誌不回傳 Key。清除 Key 同時停用 `FISH_API_KEY` 回退，避免清除後仍付費；輸入新 Key 可重新啟用。私人設定、素材與生成結果均不提交 Git。

`DSH_CHARACTER_VOICE_CONFIG` 可指定替代設定檔；只接受本人提供的 Fish Key／`FISH_API_KEY`，不搜尋其他服務憑證。手動格式見 config.example.json。`rightsConfirmed`、`allowPaidRequests` 由本人設定，模型工具不能修改。`allowReferenceUpload` 僅供進階工具上傳，預設關閉；GUI 採單次選檔明確確認。

## 原生工具

- `list_voice_profiles()`：可用角色與設定引導，不回傳 Key。
- `create_voice_profile({name,reference_id})`：本機匯入 ID。
- `create_voice_profile({name,path,transcript?})`：進階上傳工具，需本人在設定另允許指定素材上傳；一般使用者用設定頁選檔。
- `check_voice_connection()`：GET 檢查預設聲線，不生成音訊。
- `generate_character_audio({text,direction?,voice_profile?,segments?,format?,output_name?})`：生成有效 WAV，回傳位置；DSH 再以 `present({files:[{path:file_path,description:'角色語音 WAV'}]})` 交付。內嵌播放器不是成功條件。

工具遵守 DSH scope/restrictions，沒有放寬檔案權限或改其他插件。rc.5 standard/ptc/cordis 均包含 present，web bundle 有 ui-deliverables；自訂 preset 需自行包含 present。

## 音訊、限制與錯誤

Fish TTS 相容處理僅在 回應完整讀到 HTTP EOF 後，接受已知的 `RIFF=0xFFFFFF24` / `data=0xFFFFFF00` 佔位長度。限定標準 44-byte 標頭、fmt 長度 16、PCM16、單聲道、44.1kHz，且 data 在固定 chunk 邊界；不搜尋字串 `data`，不將任意超長宣告改為實際長度。轉換只改副本的兩個長度欄位，PCM 不變。一般 WAV／參考音檔仍嚴格驗證，缺少奇數 chunk padding、未知佔位、RF64 或不符合限定的佔位 layout 都不自動修補。

這項相容處理限定 Fish 的「data 延伸至回應 EOF」契約：已正常結束但提早截短、仍對齊的 PCM，或被當作 PCM 傳送的尾端 metadata，無法單靠 bytes 判別。串流報錯／取消會失敗且不重試付費 POST；**解析成功不代表原台詞完整，也不能用尾端低音量證明完整**。更新後仍建議以自己有權使用的內容確認效果。

照念保留原文；segments 各段 text 接起來必須和總 text 完全相同。省略分段 direction 時沿用主 direction。Fish 使用 normalize:false。台詞的 `[]<>` 保留符號會拒絕，避免與指令混淆。

明確停頓插入全零音訊樣本，pause_after_ms 和下一段 pause_before_ms 相加。**保證額外插入的靜音長度**；模型自然停頓可能使可聽間隔更長。每段驗證 PCM16 WAV，統一單聲道 44.1kHz，不同採樣率用線性重採樣，接點 2ms 淡入淡出。唯一安全檔名、原子寫入與讀回驗證避免覆寫與損壞。

限制：6000 總字元、每段 1500、最多 20 段、每段語氣 500 字元；單一停頓 30 秒／總停頓 120 秒、總音訊 10 分鐘。WAV-only MVP；MP3 在 API 前明確拒絕，不下載來源不明 FFmpeg。

同時一個生成任務；401/402/403/429/5xx、逾時、取消、空／壞 WAV 有明確錯誤，失敗釋放 busy。付費 POST **不自動重試**；只讀 GET 對 429/502/503/504 最多再試一次。已送出的請求取消後仍可能計費。多段中途失敗回報完成段數，不交付假完整音訊。

建聲線結果不確定時，不允許同回執重送，先查 Fish 帳號。遠端建成而本機儲存失敗會顯示恢復用 reference ID。原始服務錯誤不進工具輸出或控制台，避免夾帶秘密／私人文字。

## 可選 VoxCPM 與測試

cloudVoxCPM／CloudVoxCPMProvider 僅保留擴充邊界：未設回 VOXCPM_NOT_CONFIGURED，填 URL 仍回 VOXCPM_ADAPTER_REQUIRED，**目前不是可用 VoxCPM 整合**。不租 GPU、不公開上傳，不影響獨立 Fish 流程。

```powershell
npm run build
npm test
npm run check
```

本人填 Key、建立聲線、確認權利／費用後，可用第三句對話驗證完整流程。進階可在使用者工作區執行 `node '<插件資料夾>\scripts\live-smoke.mjs' --confirm-paid`；這不單獨代表 DSH UI 驗收。詳細實測與未驗項目見測試報告。

## 官方依據（核實日 2026-10-31）

- [DSH 發布](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)、[工具](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)、[registry](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/README.md)
- [present](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/tool-present/src/index.ts)、[ui-deliverables](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-deliverables/README.md)
- [Fish 私人聲線](https://docs.fish.audio/features/voice-cloning)、[Create Model](https://docs.fish.audio/api-reference/endpoint/model/create-model)、[TTS](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech)、[Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3)

以現場 rc.5 API 為準，不假定 master 與本機一致。Fish 使用 POST /model 建私有聲線與 POST /v1/tts、model: drama-3 標頭，不猜測 privatevoice TTS 路徑。

## 授權、費用與聲音權利

本插件自有程式採 [MIT](LICENSE)，第三方依賴歸屬見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；公開前工程審查見 [PUBLIC-REVIEW.md](PUBLIC-REVIEW.md)。MIT 不授予 Fish 模型、聲線、錄音、角色素材或商標的權利，也不取代服務條款。這是獨立社群插件，並非 DeepSeek 或 Fish Audio 官方產品。

每位使用者須使用自己的 Fish 帳號與 API Key，承擔 [Drama 3 費用](https://docs.fish.audio/features/text-to-speech/drama-3#pricing)，並遵守 [Fish 服務條款](https://fish.audio/terms/)及 [隱私政策](https://fish.audio/privacy/)。是否可商用取決於帳號適用條款與方案，不能因插件 MIT 就推定生成內容可無條件商用。上傳前須取得錄音、聲音／肖像及文本必要權利；private 聲線仍會交由 Fish 處理，不等於離線或免除其資料條款。
