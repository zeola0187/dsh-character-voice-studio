# Verification record — 2026-10-31

Candidate: **0.1.0-rc.1**. Windows, Node 24.14.1, installed DSH **0.2.1-rc.5**. No Fish Key supplied. No private audio was opened or uploaded. No paid Fish or DSH model request was made. No model weights/GPU dependencies were installed. Existing VoxCPM, Seeker, SCEAN and model-provider settings were not modified.

## Passed

- Official CLI local install into the real `desktop` profile; dependency and bundle appended by `dsh plugin`. CLI path: `E:\DSH\resources\runtime\cli\bin\dsh.cmd`.
- Official CLI local install into `voice-studio-verification` under an isolated project-local DSH_HOME. Actual profile startup loaded the bundle and dispatched `generate_character_audio`; observed `FISH_KEY_REQUIRED` and `VOICE_PROFILE_PROBE_PASS`. No fake registry used for this test. The initial probe ran before asynchronous plugin mounting; waiting for `tools/change` fixed the test timing, then startup passed.
- 30 offline tests, 30 passed: API headers/body, private multipart creation, transcript, zero API calls for imported ID, 401/402/403/429/500/503, conservative retry, timeout, cancellation, empty/corrupt/truncated WAV, rights/cost/upload gates, Unicode paths, unique atomic outputs, repeated generation, failure recovery, one active job, disabled MP3, unconfigured VoxCPM, configured reference precedence, response bounds, preserving a created reference ID after local persistence failure or cancellation.
- WAV silence test: two 0.1-second synthetic tone segments plus **88,200 all-zero samples** = **2.2 seconds** at 44,100Hz; the inserted pause is exactly 2 seconds. Mixed sample rate/stereo normalization validated. These are synthetic test tones, not generated speech.
- Installed DSH Cordis / defineTool / ToolRuntime integration: actual registration and dispatch, synthetic inherited scopes named standard/ptc/cordis, PTC SDK visibility, no-Key result. This checks registry behavior, not full preset UI behavior.
- Installed `dsh-tool-present` validates an existing one-second WAV and appends `deliverables/presented` using a test session/FS adapter. This is an actual present implementation with an artificial session, not the running Desktop conversation.
- Read installed rc.5 standard/ptc/cordis preset files: all include `present`; installed web bundle includes `ui-deliverables`. Runtime API differs from current master, and implementation uses rc.5.
- `npm run check`: runtime JavaScript matches source; no prepare/install-time build.
- Private repository created and pushed: https://github.com/zeola0187/dsh-character-voice-studio . `gh repo view` reports `isPrivate: true`. Existing keyring/Git authorization used; no new token, embedded credential or force push.
- Official CLI accepted **both** `https://github.com/zeola0187/dsh-character-voice-studio` and `github:zeola0187/dsh-character-voice-studio` in the isolated verification profile. The homepage URL was normalized to a git+https dependency.
- Actual startup after GitHub installation passed the native tool/no-Key probe (`VOICE_PROFILE_PROBE_PASS`). The test loaded the Git-installed package, not the development link. Initial Git-tested commit: `8d7bf40`.
- Tracked-file privacy scan passed: no private audio, actual API credentials, user config, generated audio or test output committed. `.gitattributes` keeps executable source and release files consistent across checkout.

## Pending

- Desktop UI plugin manager URL-entry test and visible audio delivery/download. The existing DSH window was minimized; the UI tool could not bind it. A request to restore the existing window is pending. No restart/force-close was attempted, and no private chat screenshot was captured.
- Actual Fish private voice creation, paid Drama 3 WAV response, voice likeness/direction quality, Chinese naturalness: require the user to run setup.cmd, supply Key and an existing reference ID or explicitly selected clean WAV, and confirm rights/cost/upload as applicable.
- Natural-language DSH model selection→tool→present end-to-end. No separate authorization to spend on a DSH model for this new plugin was inferred from earlier unrelated projects.

## Reproduce

`npm run build`, `npm test`, `npm run check`. Native host integration: set `ELECTRON_RUN_AS_NODE=1` and `DSH_TEST_MODULES` to the installed DSH `dsh/node_modules` directory; launch `test/native-host.cjs` with the installed Electron executable using `--expose-internals`. The test output stays gitignored.

The official CLI probe is `test/profile-probe.js`, loaded by an extra test-only `--patch` row into the isolated verification profile. Set `DSH_CHARACTER_VOICE_CONFIG` to a missing/empty test config and `DSH_VOICE_PROBE_RESULT` to a writable output JSON. It calls no model and exits only its own test process.

For the next real cloud test, finish local setup, then use the README's third natural-language prompt in DSH. Alternatively run `scripts/live-smoke.mjs --confirm-paid` from a user workspace; that creates a real WAV and reports its duration, but does not alone validate DSH present UI. Never claim the offline tones as cloud results.

## Known limits

WAV-only MVP; MP3 fails before billing. Maximum 20 segments, 1500 chars per segment/6000 total. Linear resampling is only a compatibility path; requests ask Fish for mono PCM16/44.1kHz. Explicit inserted silence is exact, but model-generated natural silence can add to the audible interval. Partial successes can incur charges even if a later segment fails; no automatic paid retry. Optional VoxCPM endpoint is an unimplemented extension boundary, explicitly reported as such. No v0.1.0 final tag is claimed before the relevant acceptance work is complete.
