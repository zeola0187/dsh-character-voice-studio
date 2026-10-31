# Verification record — 2026-10-31

Candidate **0.1.0-rc.3**, Windows, Node 24.14.1, actual DSH **0.2.1-rc.5**. No real Fish Key or private voice material supplied. All audio in automated tests is synthetic. No paid Fish or DSH model requests. No GPU/model installation. Other projects and dsh-fish were not modified by this update.

## Passed in rc.3

- **46/46 offline tests**: original 30 audio/provider/service cases plus 12 settings-store cases and four actual React component tests. API shape, rights/cost/upload gates, cancellation, timeout, 401/402/403/429/5xx, no paid POST retry, corrupt/empty WAV, Unicode, unique atomic files, consecutive generation, busy release, MP3 rejection, optional VoxCPM error retained.
- Secret lifecycle: no plaintext Key in settings get/save response or tools; blank keep preserves existing Key; replace works; clear disables environment fallback; unrelated saves do not persist environment Key; stale revisions rejected.
- WAV picker workflow: browser preflight and host validation, bounded 20MB upload to local staging only, receipt without absolute path, no Fish call on selection, name and explicit rights/upload/cost confirmation before private creation, successful Mock creation becomes default, original file unchanged. GUI consent does not globally authorize model-requested uploads. An uncertain paid result cannot reuse the same receipt.
- React component tests exercise actual input/button handlers, password masking, no prefilled Key, save status, explicit delete confirmation, file selection, confirmation gates and default voice update. These use react-test-renderer, not a real desktop picker/window.
- Official CLI isolated profile `voice-studio-verification` (project-local DSH_HOME, base + this plugin only) starts the actual installed Host. No dsh-fish or desktop inheritance.
- Real Host clientModules graph discovers the immediately loaded plugin and settings dependencies. The **actual rc.5 ModuleLoader** materializes compiled lib/client.js through **actual fetchBundle**.
- Strict host Typert descriptor mounts. **Actual Typert Gateway dispatch** handles save/get/clear via a synthetic owner peer, exercises Cordis invocation context and redaction. Non-owner and absent invocation rejected. No network authentication is forged or changed: the peer is a test input in the isolated process.
- Client entry registers both settings.section / character-voice and plugins.bundle.config / dsh-character-voice-studio, plus Chinese/English dictionary, using test client slots/locale adapters. Native probe prints **VOICE_SETTINGS_PROFILE_PROBE_PASS**; evidence in ignored test-output/settings-profile-probe.json. This is native module/Gateway integration, not proof of visual desktop navigation.
- During probe development, adding Gateway/access services already present in base caused duplicate-service warnings; extra test rows were removed. A too-early strict-schema assertion was fixed to wait for documented asynchronous Typert loader registration. The clean final probe passes.
- Exact silence: 88,200 all-zero samples = **2 seconds** at 44,100Hz between two 0.1-second synthetic tones; result 2.2 seconds. Mixed rates/stereo normalization tested.
- Build/check validates all source and committed lib counterparts, exact generated client bundle, package exports, settings patch wiring, and no prepare step.
- npm pack dry-run includes all backend modules, compiled client, patch, fallback setup, example config and user-run live smoke. No audio/config/credentials packaged.
- npm audit production dependencies: **0 vulnerabilities**. Plugin zod pinned to 4.6.7; Host dependencies untouched.
- After the push rejection, completed independent local packaging verification: official CLI installed dsh-character-voice-studio-0.1.0-rc.3.tgz into a **fresh** voice-ui-package-verification profile. Actual packaged node_modules client asset passed ModuleLoader + strict schema + Gateway save/get/clear probe. Evidence: test-output/settings-profile-probe-packed-fresh.json. No development symlink was used for this final run. The earlier reused profile retained a development symlink and is not counted as packed-install evidence.
- Tested initial local archive SHA256: E26056B40F2645436223733A7E075FD8F77C64284153BC0EF7F6AD74EEA0CF17. That archive predates the release documentation update; the runtime code is unchanged. Prefer the delivered Git commit for current documentation. No rc.3 tag exists.
- Git commit **08eca6a5c4e1915c7f7724dd89c9425d61d85830** pushed and remote readback matched. Official CLI installed github:zeola0187/dsh-character-voice-studio#08eca6a into a **fresh voice-ui-git-verification** profile. The actual Git-installed client asset, strict descriptor and Gateway probe passed (**VOICE_SETTINGS_PROFILE_PROBE_PASS**, test-output/settings-profile-probe-git.json). Release documentation/tag does not change this runtime.

## Earlier baseline evidence retained

- Official CLI path: `E:\DSH\resources\runtime\cli\bin\dsh.cmd`; real profile: `desktop`. rc.2 was installed via `github:zeola0187/dsh-character-voice-studio#v0.1.0-rc.2`.
- Actual Git-installed native tool registration/dispatch and no-Key result passed in isolated profile, **VOICE_PROFILE_PROBE_PASS**.
- Installed Cordis / defineTool / ToolRuntime tests cover inherited standard/ptc/cordis scopes and PTC SDK. Installed present implementation validates one-second WAV and appends deliverables/presented with artificial session/FS adapter. This is not the real desktop conversation.
- Installed rc.5 presets all include present; web bundle includes ui-deliverables.
- Private repository https://github.com/zeola0187/dsh-character-voice-studio ; existing GitHub/GCM authorization only, no embedded credential, force push or public repository.
- Both GitHub homepage URL and github: spec accepted by official CLI. UI manager paste/click path not verified.

## Pending / not claimed

- **Candidate tag publication blocked**: automatic review rejected creating/pushing v0.1.0-rc.3, stating that push authorization did not explicitly cover tag publication. The combined command did not execute; local tag absence confirmed. No retry or alternative tag route attempted. Existing Git commits remain available for installation; package version is 0.1.0-rc.3 without a corresponding Git tag.
- The first commit/push attempt was rejected because automatic review did not recognize the user's original push authorization. It did not execute. After the parent supplied exact original user authorization, one normal retry succeeded; no alternate route or force push was used. Git publication is no longer blocked. Desktop visual acceptance remains pending as described below.
- **Real desktop settings UI and file picker end-to-end**. Source/component/native loader/host RPC tests passed, but no screenshot or desktop click validation. Prior automation encountered geometry/concurrent-input limits. Parent reports another task's whole-window screenshot was denied for private-chat exposure; this update does not retry or bypass that capture. No restart is authorized for this update.
- True Fish private voice creation and paid Drama 3 audio response; likeness, expression, Chinese naturalness, long-text stability. No Key/material/paid authorization supplied.
- Natural-language DSH model → voice tools → real conversation present/download flow. No unrelated model-spend authorization reused.
- Final v0.1.0 intentionally withheld. RC is installable candidate code, not a claim that real audio or visual UI acceptance is complete.

## Reproduce

`npm run build`, `npm test`, `npm run check`. Native settings probe: use an isolated base + voice profile, add test-only patch rows for @deepseek-ai/dsh-client-modules and test/settings-profile-probe.js, set DSH_CHARACTER_VOICE_CONFIG to an isolated empty test config and DSH_VOICE_SETTINGS_PROBE_RESULT to an output JSON. Run official CLI with --profile and --patch. It exits only its own test process and makes no model/Fish request.

Original native integration: run test/native-host.cjs with installed Electron in ELECTRON_RUN_AS_NODE mode, --expose-internals and DSH_TEST_MODULES pointing to installed dsh/node_modules. Test outputs stay ignored.

Next user step: **DSH 設定 → 角色語音 → 填 Key 並儲存 → 選 WAV、命名與本人確認 → 建立私人聲線並設預設**. Then use README's exact-pause conversational prompt. Alternatively run scripts/live-smoke.mjs --confirm-paid from a user workspace; this generates a real WAV but alone does not validate present UI.

## Limits

Key stored in a local configuration file, not encrypted OS credential storage. Owner account/filesystem must be protected. Abandoned staged WAV copies may remain under local imports; successful creation/discard removes its copy, never the original. Unknown paid outcomes require checking Fish before retry. WAV-only; MP3 and optional VoxCPM synthesis are explicitly unavailable. Max 20 segments / 6000 total characters. Linear resampling is a compatibility fallback. Explicit added silence is exact; natural model pauses can add duration. No statement about real voice quality is supported by synthetic tests.
