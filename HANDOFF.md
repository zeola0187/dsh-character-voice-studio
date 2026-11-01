# 0.2.0-dev.1 feature branch handoff

Development branch: `feat/voice-director-v02`, based on main's Chinese-label change. No stable tag, release, main update or Desktop deployment. See [Voice Director contract, limits and natural-language acceptance prompts](VOICE-DIRECTOR.md) and [current verification](TEST-RESULTS.md). This adds a packaged native DSH Skill, deterministic performance compiler, JSON Schema and offline preview. Production settings, WAV modules and providers beyond Fish are unchanged. Real cloud generation and model-driven natural-language acceptance remain unverified and need user authorization.

## Stable 0.1.0 release history

- Repository: https://github.com/zeola0187/dsh-character-voice-studio
- Version tag: [v0.1.0](https://github.com/zeola0187/dsh-character-voice-studio/tree/v0.1.0)
- Release: https://github.com/zeola0187/dsh-character-voice-studio/releases/tag/v0.1.0
- Install source: `github:zeola0187/dsh-character-voice-studio#v0.1.0`
- Supported/tested host: DSH **0.2.1-rc.5**, Windows, Node **24.14.1**. Final commit identity is available from the tag; use the full SHA in place of v0.1.0 when pinning a commit.

## 使用

在 DSH 插件管理頁安裝。已安裝舊版時，rc.5 一般 Git 插件須先移除，再安裝固定版本；正常移除不刪本插件儲存在使用者目錄的設定。若設定頁未出現，由使用者重新開啟 DSH。

到「設定 → 角色語音」填自己的 Fish API Key。選擇有權使用的 WAV、填角色名、確認這次雲端上傳與費用，再按「建立私人聲線並設為預設」。已有 ID 可在進階匯入。之後用自然語言要求台詞、語氣及停頓，成功後由 DSH present 交付 WAV。三句可直接使用的對話見 [README](README.md#三句對話範例)。一般操作不需要 CMD、路徑或 JSON。

CLI 備用：`dsh plugin --profile desktop add 'github:zeola0187/dsh-character-voice-studio#v0.1.0'`。需使用實際 profile 和已加入 PATH 的官方 CLI；這份交接不表示已替使用者執行升級。

## Release change and acceptance

0.1.0 retains the accepted rc.4 runtime implementation, including the exact Fish placeholder WAV adaptation and strict general decoder. Release changes are MIT/license notices, public-safe documentation, metadata and an offline all-history audit script. No new synthesis model, hidden API retry or desktop deployment is introduced.

The owner confirmed plugin acceptance. The release engineer separately reran the offline suite and native registry/present test; these do not establish a new paid generation or every voice's performance. See [test evidence](TEST-RESULTS.md) and [license/privacy review](PUBLIC-REVIEW.md).

## Known limits and follow-up

- WAV only; MP3 is rejected before API use. Optional cloud VoxCPM remains an explicit unimplemented adapter.
- No guarantee of exact pronunciation, voice similarity, complete spoken text or compliance with every natural-language direction. Digital inserted pause duration is exact; model-generated pauses can add to it.
- An aligned early EOF in unknown-length Fish PCM cannot be detected from bytes alone. Only the documented exact header/layout is adapted; arbitrary malformed WAV is not repaired.
- Local Key storage is a user configuration file, not an OS credential vault. Consent gates and response redaction do not replace protection of the host account.
- No hosted CI is configured. Cross-platform testing, future DSH/API compatibility, credential-vault support and additional codecs are possible later improvements.
- MIT covers the project's own code. Fish accounts, charges, voices and content rights remain governed separately. No API Key, voice material or test audio is included in the release.
