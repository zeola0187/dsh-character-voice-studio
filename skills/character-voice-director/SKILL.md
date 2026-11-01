---
name: character-voice-director
description: Direct character voice WAV delivery from natural-language acting requests including emotion, intent, local pace or whisper, breaths, sighs, laughter and exact inserted pauses. Use with Character Voice Studio; no recording, live conversation or automatic playback.
---

# 角色語音導演

把使用者的自然語言表演意圖轉成 Voice Studio 工具參數。由 DSH 理解需求；插件只驗證、編譯和生成，不另呼叫 LLM。不要要求使用者學 Fish 標籤或 JSON。

## 保留台詞與授權

使用者要求照念時，保留 text 的每一個字元，包括標點、空白、換行、中英日文及 Unicode；不可翻譯、加旁白、修飾台詞或把動作說出來。若要求創作，先寫出最終台詞，再安排表演。若不確定哪些字是台詞、哪些是指示，先問清楚。

先用 list_voice_profiles 了解預設聲線。沒有 Key 或聲線時，引導使用者到「設定 → 角色語音」本人設定 Key、選有權使用的 WAV、確認雲端上傳和費用並建立預設聲線。不要搜尋私人音檔、索取對話中的 Key，或推測使用權、上傳與計費同意。設定頁確認與現有工具授權規則仍有效。生成是付費雲端動作；預覽不計費。此 Skill 的載入本身不授權生成。

## 選擇最小計畫

- 簡單照念：generate_character_audio 的 text 即可；整段情緒、意圖、音量或語速放 direction，使用自然語言，不含方括號或 XML。
- 舊版 baseline 仍有效：segments 每段提供 text、可選 direction、pause_before_ms／pause_after_ms。所有段落 text 串接必須等於完整 text。每段是一次可能計費的請求。
- 需要局部控制或聲音事件時使用 performance 陣列，與 segments 互斥。保留最外層 text，可同時提供整體 direction。不要直接傳 script 或 raw tags。

performance 有三種節點：

1. speech：{type:"speech",text:"原文片段",direction?:"自然語言",controls?:["whisper"]}。每節點至多一種局部控制：whisper 耳語、emphasis 強調、soft 輕柔、fast 較快、slow 較慢、stress 重讀、forceful 有力。其他情緒、漸變、意圖、音量用 direction 描述；對不同片段明確描述轉變。方向指令的持續範圍和表演效果依模型決定，後續恢復語氣要明確指定。不得承諾精確速度、音量或重音幅度。不可加入任意數值參數或嵌套標籤。
2. sound：{type:"sound",event:"breath"}，支援 breath 呼吸、sigh 嘆息、chuckle 輕笑、laugh 笑聲。插在指定的 speech 節點之間，或一段台詞前後；不是要念的字。不保證模型一定產生或事件時長。不可用 sound 表示精確停頓。
3. pause：{type:"pause",duration_ms:2000}。只有正值 pause 切分雲端請求；插件在有效 WAV 中插入精確全零 PCM。2000 毫秒等於 2 秒插入靜音，模型本身呼吸、尾音或留白可能讓總可聽間隔更長。

所有 speech.text 串接必須逐字等於最外層 text；sound／pause 不增加台詞。局部控制和事件可留在同一請求，不要為每個詞額外切段。不支援會明確報錯，不要用未知欄位碰運氣或悄悄省略需求。

限制：最多 100 個節點、20 個聲音事件、20 次請求；text 最多 6000 個 JS 字元，每個精確停頓隔開的請求最多 1500 字元且必須含台詞。每個 pause 為 0–30000 毫秒整數，總計最多 120 秒。編譯腳本每請求最多 24000 UTF-8 bytes，總共 48000 bytes。若超限，請先縮短或和使用者確認拆成多次工作，不能自行增加費用。

## 預覽、生成及交付

複雜表演先呼叫 preview_character_audio，檢查編譯結果、台詞保留、請求數及插入靜音位置。預覽是純離線，不驗證 Key、帳戶或實際聲音效果。不要將預覽 script 回傳為生成參數：生成仍用原來的 text／direction／performance。

示例：台詞「辛苦了。休息吧。」、前段輕柔、句間呼吸並停兩秒：

```json
{"text":"辛苦了。休息吧。","direction":"溫柔安慰","performance":[{"type":"speech","text":"辛苦了。","controls":["soft"]},{"type":"sound","event":"breath"},{"type":"pause","duration_ms":2000},{"type":"speech","text":"休息吧。","controls":["whisper"]}]}
```

授權允許時，以同一計畫呼叫 generate_character_audio。省略 voice_profile 可用設定中的預設；不猜聲線 ID。成功後必須呼叫 present，files 為 [{path:file_path,description:"角色語音 WAV"}]，讓使用者取得可下載檔案。不要自動播放。

失敗或取消後停止，說明 completed_segments 及可能已計費，不能自動重送，也不要把不完整結果說成成功。原文完整性是結構驗證；實際是否逐字唸完、聲線相似和表演自然度須聆聽驗收。不要聲稱預覽或 Mock 驗證等於真實 Fish 生成通過。
