# DSH Character Voice Studio

原生 DSH Bundle：自然語言台詞／表演指示 → Fish Audio Drama 3 → 本機有效 WAV → DSH `present` 檔案交付。沒有第二個 LLM、播放器、麥克風、本地模型或 GPU 依賴。

目前為 **0.1.0-rc.1 驗收候選版**。沒有提供 Fish Key，真實雲端音質與完整自然語言流程尚未驗證；詳見 [TEST-RESULTS.md](TEST-RESULTS.md)。

## 安裝

支援已現場核對的 **DSH 0.2.1-rc.5**，profile **desktop**。其他版本會由 `engines.dsh` 拒絕，需重新驗證後擴大版本範圍。

```powershell
& 'E:\DSH\resources\runtime\cli\bin\dsh.cmd' plugin --profile desktop add github:zeola0187/dsh-character-voice-studio
```

這是目前電腦上的 CLI 絕對路徑。其他電腦可用已加入 PATH 的 `dsh plugin --profile desktop add ...`。私有倉庫使用既有 GitHub/Git Credential Manager 登入，不把 Token 放進 URL。上述 `github:` spec 與 GitHub 首頁 URL 均已由官方 CLI 實測安裝成功，且 Git 安裝後原生工具啟動通過；**插件管理頁直接貼 URL 的 UI 操作尚未驗證**，不要將 CLI 結果當成 UI 驗收。

倉庫已包含可執行 `lib/*.js`，Git 安裝不需 build/prepare，不使用原生音訊依賴。`src/*.js` 是 ESM 原始碼，`npm run build` 將其精確複製成發布產物；`npm run check` 確認無過期產物。套件僅共享 Host 的 `@deepseek-ai/dsh-tools` optional peer。

## 第一次設定

在插件資料夾雙擊 **setup.cmd**，或 PowerShell 執行 `setup.ps1`。Key 使用遮罩輸入，不要貼進 DSH 對話。設定存放在：

```text
%USERPROFILE%\.dsh-character-voice-studio\config.json
```

可先輸入既有 Fish `reference_id`。若要用 WAV 建立聲線，可以留空，接著在 DSH 呼叫 `create_voice_profile`。聲線清單在同目錄 `profiles.json`，不會進 Git。設定每次工具呼叫重新讀取，改 Key 不需要重啟。手動設定可參考 `config.example.json`；`DSH_CHARACTER_VOICE_CONFIG` 可指定另一個絕對設定檔路徑。只支援本插件明確的 `FISH_API_KEY` 環境變數，不搜尋或挪用其他服務憑證。

本人須確認三個開關：

- `rightsConfirmed`：擁有聲音、素材必要使用權限。
- `allowPaidRequests`：允許台詞與表演指示傳給 Fish，並接受可能費用。
- `allowReferenceUpload`：允許將自己指定的參考 WAV 傳給 Fish 建立私人聲線。

開關只由使用者在本機設定，不接受模型工具參數假冒同意。輸入 Key 本身不等同同意費用或上傳。建立聲線固定 `visibility=private`、`generate_sample=false`；不將私人素材上傳 GitHub。私人是 Fish 帳號內的可見性，Fish 仍會收到指定素材。

可手動設定 `defaultProfile`、`defaultReferenceId`、`outputDirectory`（空白時使用 DSH 工作區下 `generated_audio`）、`defaultFormat`（使用 wav）。`defaultProfile` 優先，否則使用 `defaultReferenceId`，都空白才使用第一個本機 profile。

## 工具

`list_voice_profiles()`：離線列出聲線與就緒狀態，不回傳 Key。

`create_voice_profile({name, reference_id})`：匯入已有 ID，不呼叫 API。

`create_voice_profile({name, path, transcript?})`：上傳使用者指定的乾淨 **3–120 秒、20MB 以下 PCM16 WAV**，可選逐字稿。名稱不可覆蓋既有 profile；相同 ID 可以另取名稱。若遠端成功但本機儲存失敗，會回傳 ID 讓使用者匯入，避免再次建立。

`check_voice_connection()`：GET 檢查預設聲線認證與狀態，不生成語音。

`generate_character_audio({text, direction?, voice_profile?, segments?, format?, output_name?})`：產生有效 WAV 後回傳完整路徑、檔名、格式、時長、聲線、段數與靜音取樣範圍。成功後 **DSH 要接著呼叫 `present({files:[{path:file_path,description:'角色語音 WAV'}]})`**。檔案交付卡通常在回合結束時出現。若沒有內嵌播放器，下載／用本機程式開啟即可。

工具掛在全域 registry，遵守 Host 的 scope/restrictions，供 standard、ptc、cordis 三條預設路徑繼承；PTC 使用 `tools.generate_character_audio(...)`。三種 rc.5 官方 preset 皆包含 present，web bundle 包含 ui-deliverables。本插件不修改既有 preset、不放寬權限、不覆寫其他插件限制。自訂 preset 若不提供 present，應透過官方設定加入 present 後使用。

### 語氣、原文與停頓

DSH 負責理解自然語言與撰稿。要求「照念」時 text 不可改字；direction 獨立於台詞，由 Provider 組成 `[語氣]台詞`。`normalize:false` 避免 Fish 文字正規化改寫內容。生成模型仍可能念錯或誤讀，需要真人聽驗。

若提供 segments，每段 text 依序連接必須與完整 text 完全一致，包括標點與空白。每段可設定 direction，省略時沿用主 direction。明確停頓會在 WAV 內插入真正零振幅取樣；`pause_after_ms` 與下一段 `pause_before_ms` **相加**，不要重複指定同一停頓。模型自身也可能有自然停頓，所以能保證的是額外插入兩秒數位靜音，不是兩句可聽語音之間恰好只有兩秒。

各段 WAV 驗證 RIFF/chunk 大小及 PCM16，必要時統一單聲道 44.1kHz；不修剪語音，兩端使用 2ms 淡入淡出抑制接點爆音。不同取樣率採線性重取樣；正式請求固定要求 44.1kHz，通常不需重取樣。

限制：完整 text 最多 6000 字元，每段最多 1500，最多 20 段；每段語氣最多 500；單一停頓 30 秒，總明確停頓 120 秒；總音訊 10 分鐘。台詞不接受 `[]<>` 控制標籤字元，避免原文與指令歧義。若必須唸出這類符號，先由使用者決定口語寫法。Windows 安全檔名＋時間＋隨機 ID，不覆蓋舊輸出。

首版 `mp3` 會在呼叫 API 前回報 `FORMAT_UNAVAILABLE`，請選 wav。沒有自動下載 FFmpeg 或來路不明 binary。

### 三句可直接使用的提示詞

1. 請使用預設角色聲線，逐字念出「你好，很高興見到你。」，不要添加語氣，生成 WAV 並用 present 交付檔案。
2. 請用預設角色聲線，以溫柔、慢速、略帶疲憊的語氣，逐字念出「今天辛苦了。先閉上眼睛，好嗎？晚安。」，把表演指示放 direction，生成 WAV 並交付檔案。
3. 請逐字念出「今天辛苦了。晚安。」，語氣溫柔慢速，分成「今天辛苦了。」與「晚安。」兩段，在第二段設定 pause_before_ms=2000，第一段不要重複加停頓；生成 WAV 並用 present 交付。

## 故障與取消

同時一項工作；DSH 取消訊號會傳給網路下載與檔案讀取。已發送的請求取消後仍可能計費。付費 POST **從不自動重試**；429、401/402/403、5xx、空音訊、格式錯誤、斷線與逾時均回傳不同 error_code。只讀 GET 的 429/502/503/504 最多額外重試一次，退避 500ms。失敗後 busy 會釋放。部分段落成功後若失敗，回報 completed_segments，但不交付不完整音檔；重試前留意先前段落可能已計費。

缺 Key、未確認權利、未同意費用、未允許上傳時，在呼叫雲端前停止。原始服務錯誤本文不進工具輸出或日誌，以免 Key 或私人文字被回顯。輸出先驗證、暫存寫入、原子 rename、再讀回驗證。

## 可選 VoxCPM Cloud

`cloudVoxCPM` 設定與 `CloudVoxCPMProvider` extension boundary 已預留。無端點回報 `VOXCPM_NOT_CONFIGURED`；即使填 URL，在該服務 schema 尚未驗證及實作前回報 `VOXCPM_ADAPTER_REQUIRED`。**目前不是已完成的雲端 VoxCPM 整合**，不租 GPU、不傳參考素材到任意 URL。路徑 A 的 Fish WAV 匯入與 TTS 獨立運作。

## 測試與下一步

```powershell
npm run build
npm test
npm run check
```

`test/native-host.cjs` 使用已安裝 DSH 的真 Cordis/tools/present 套件，配合人工 session、檔案 adapter，不呼叫 LLM/Fish。這不等於正式 Desktop UI 驗收。真實付費生成可在本人完成設定後執行：

```powershell
# 在使用者的 DSH 工作區執行，不在插件目錄輸出
node '<插件資料夾>\scripts\live-smoke.mjs' --confirm-paid
```

DSH 自然語言→工具→present 的真人流程，使用上面第三句提示詞一次完成；需既有 DSH 模型與 Fish 帳號可用，且本人允許這些呼叫。

## 官方依據（核對日期：2026-10-31）

- [DSH Bundle 發布與安裝](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
- [DSH 工具開發](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)、[工具 registry](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/README.md)
- [present](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/tool-present/src/index.ts)、[ui-deliverables](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-deliverables/README.md)
- [Fish 建立私人聲線 multipart 範例](https://docs.fish.audio/features/voice-cloning)、[Create Model schema](https://docs.fish.audio/api-reference/endpoint/model/create-model)
- [Fish TTS schema 與錯誤](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech)、[Drama 3 語氣標籤](https://docs.fish.audio/features/text-to-speech/drama-3)

官方文件 master 與本機 rc.5 有差異；實作與原生測試以本機安裝的 API 為準。例如 rc.5 present 使用 sessionProjections，不能直接套用新版 master 的 agents API。
