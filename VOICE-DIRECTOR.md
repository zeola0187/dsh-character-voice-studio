# AI Voice Director — 0.2.0-dev.1

Development candidate on `feat/voice-director-v02`, not a stable release. The stable `v0.1.0` tag is unchanged. No live Fish generation, paid LLM, reference upload, Desktop deployment or restart is part of this verification.

## Integration and sources

Checked 2026-11-01 against the installed DSH **0.2.1-rc.5**, build `d4db512a969fccf0c5cc7ec8fe38e9c1d27af916`. Its actual `dsh-skill` implementation exposes `register`, `list`, `get`; `dsh-tool-skill` loads the selected body on demand. The base profile already mounts both services. The plugin registers the packaged `character-voice-director` definition through optional `ctx.inject(['skills'], ...)`, so old tools remain available in hosts without the registry; such custom hosts must mount the official Skill registry/consumer for Skill discovery. No global model route or prompt injection is added. The catalog contains a name and description, not the full instructions; the official `skill` tool supplies those when selected.

Public references (the installed version, not moving master, decides compatibility):

- [Fish Drama 3](https://docs.fish.audio/features/text-to-speech/drama-3): natural-language bracket directions/events and seven local paired tags.
- [DSH Skill subsystem at the installed build](https://github.com/deepseek-ai/deepseek-harness/blob/d4db512a969fccf0c5cc7ec8fe38e9c1d27af916/docs/subsystems/skills.md).
- [DSH Skill registry reference](https://github.com/deepseek-ai/deepseek-harness/blob/d4db512a969fccf0c5cc7ec8fe38e9c1d27af916/packages/skill/skill/README.md).

This code and Skill are original MIT project contributions. No third-party source, sample audio or private material is embedded. Existing third-party notices still apply; Fish service/account/fees and voice/content rights remain separate from MIT.

## Request contract

`generate_character_audio` retains its name and legacy `text`, `direction`, `segments`, voice selection and output fields. New `performance` is mutually exclusive with `segments`. Global `direction` is permitted with either mode and prefixes each request. New speech-node directions are inserted before that span; to restore a previous delivery explicitly describe the transition. Model behavior may carry over beyond a natural-language direction.

`performance` is an ordered array of:

| Node | Fields | Behavior |
| --- | --- | --- |
| speech | text, optional direction, optional controls array | Exact dialogue; at most one of whisper/emphasis/soft/fast/slow/stress/forceful |
| sound | event | breath/sigh/chuckle/laugh becomes a bracketed natural-language event at that position |
| pause | duration_ms | Positive integer inserts digital silence and separates requests; zero does not split |

See [machine-readable JSON Schema](schemas/performance.schema.json). Runtime checks additionally enforce cross-node equality and budgets. The DSH rc.5 value-schema DSL preserves discriminated unions/enums/required fields; length and numeric keywords unsupported by that DSL are enforced at runtime and documented in the full JSON Schema. Unsupported fields/nodes/controls are rejected; no raw script parameter or user tags are accepted. All speech text concatenates **exactly** to outer text, with no trimming or Unicode normalization. Sound/pause nodes do not alter it.

Limits: 100 nodes, 20 events, 20 requests, 6000 UTF-16 code units total dialogue, 1500 per request; a request must include dialogue, not isolated sound. Each pause is 0–30000 ms; total inserted silence up to 120000 ms. Compiled script up to 24000 UTF-8 bytes per request / 48000 overall. Adjacent boundary pauses coalesce; no paid empty request is introduced. Local tags are not nested because Fish does not document nesting semantics. Additional emotion, intent, volume and pacing can use plain-language direction, without guaranteed numeric control.

`preview_character_audio` accepts the same content/plan fields, produces final scripts, planned request count and pauses, and does not read credentials, contact Fish or produce audio. Generation revalidates the structured plan; callers must not send preview scripts back as raw input. Exact 2-second silence is 88200 all-zero frames at 44100 Hz, through the existing unchanged WAV joiner. This does not guarantee total audible gap, event duration, acting, completeness of spoken words or voice similarity.

Cancellation, failed segments and uncertain paid POST outcomes retain the prior no-auto-retry behavior. A later deliberate generation starts a new paid request sequence; it does not resume previously billed segments. Incomplete audio is not delivered.

## Install and test

The normal installation entry is the project homepage: `https://github.com/zeola0187/dsh-character-voice-studio`. Paste it in the DSH plugin manager's package/address field. The installed rc.5 parser accepts this as a Git spec without needing a package metadata or Host change. The remote default branch is currently **main (0.1.0, Chinese-label update)**; the homepage does **not** install this unmerged development candidate. After authorized acceptance/merge, the same homepage can serve new main installs. Do not change the default branch to bypass release approval.

For development testing use `github:zeola0187/dsh-character-voice-studio#feat/voice-director-v02` (moving branch), or pin its full commit SHA. Do not use `#v0.1.0` to obtain this feature. Git installation contains compiled JavaScript, Skill and JSON Schema; no build hook or manual Skill copying is required. Updating a branch does not update an already installed plugin automatically. If an installed UI or catalog remains stale, reopen DSH yourself. No automatic Desktop modification occurs here.

For an existing installation, follow rc.5's remove/reinstall guidance; keep the plugin's external settings data. Recognized already-installed sources are refused while HMR is active. CLI operations use pnpm resolution and lockfiles; reposting the same URL is not a guaranteed refresh. Reopening DSH reloads installed code, not the remote branch. The 2026-11-01 homepage review ran the actual installed parser for both source forms and read remote manifests/default branch; it did not perform fresh URL installations. The earlier isolated installation test used the packed 0.2.0-dev.1 package.

Offline checks: `npm run build`, `npm test`, `npm run check`, `npm run audit:public`. Native registry verification: `test/native-host.cjs` with the installed Electron Node runtime and `DSH_TEST_MODULES` pointing to that runtime's modules. Pack/install verification: create a disposable DSH_HOME/profile containing only base + this package, use the official `dsh plugin --profile <test-profile> add <packed-tgz>`, and boot with `--patch` adding `test/director-profile-probe.js`. Set `DSH_VOICE_PROBE_RESULT` to a disposable evidence path and `DSH_CHARACTER_VOICE_CONFIG` to an empty test config; unset Fish key fallback. Never copy a production profile or credentials. The probe exits without a model call. See TEST-RESULTS.md for actual completed checks and limits.

## Natural-language acceptance prompts

A. 使用預設聲線，逐字說「今天辛苦了。現在可以休息了。」用溫柔安慰的語氣，第一句後輕輕呼吸，再插入整整兩秒靜音，最後一句輕聲耳語。先給我表演預覽，不要付費生成。

B. 逐字說「我本來很冷靜，但這件事真的太重要了。」從冷靜逐漸變激動，只強調「太重要了」，保持原文。請先預覽請求數與表演安排，不要生成。

C. 逐字說「快跟上，慢慢聽，這是秘密，真有趣。」第一段較快，第二段較慢，「這是秘密」用局部耳語，最後輕笑，不要為每個局部控制分開請求。先預覽，不要付費生成。

After reviewing a preview, the user can explicitly authorize a real generation. These prompts are prepared acceptance cases, not evidence that a live model selected the Skill or that Fish produced the intended performance. Real cloud listening and natural-language model-to-tool acceptance remain pending user confirmation.
