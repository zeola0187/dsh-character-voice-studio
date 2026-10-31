# Verification record — 0.1.0

Date: 2026-10-31. Windows / Node 24.14.1 / installed DSH 0.2.1-rc.5.

## Executed for this release

- **66/66 offline tests passed**, zero failures, skips or cancellations. Fixtures use synthesized PCM and injected Mock HTTP responses, not recorded voices.
- npm run build and npm run check passed: all shipped lib modules and the ModuleLoader client bundle match source; manifest, settings injection and exports are checked. No install-time prepare/build hook.
- Native test/native-host.cjs passed against the installed DSH Cordis/tools/scope/present implementation in Electron Node mode. Real registry dispatch, four native tools, inherited scoped schemas/PTC SDK exposure, friendly missing-Key result and a real present event with valid WAV bytes were exercised. Session/filesystem adapters and scope agents were synthetic; this was not a live desktop conversation or real window playback test.
- All-history and working-tree credential/privacy scans passed. The historical baseline comprised seven commits and 62 blobs; the release commit is scanned again before public visibility changes. See PUBLIC-REVIEW.md for scope and limitations.
- Release package inspection verifies 27 packaged files: the compiled client/backend, manifest, example config, license/notices and documentation; no node_modules, private config, audio, output, diagnostic binary or log is packaged. The package remains private:true solely to prevent accidental npm publication; it is installed from Git.
- GitHub had zero configured Actions workflows at review. Local checks are not described as a hosted CI pass.

## Coverage

The suite covers normal and corrupt WAV, chunk boundaries/padding, duplicate or missing fmt/data, PCM alignment, RF64 rejection, high-bit tag aliases, the exact Fish placeholder pair, unknown sentinel rejection, false data patterns, input ownership, arbitrary HTTP chunk splits, interruption/cancellation, bounded response size and no paid POST retries. Two consecutive service generations, failure recovery and busy release are tested. Joining adds exactly 88,200 zero frames for a two-second pause at 44.1 kHz.

Settings tests cover masked Key input, no plaintext Key in responses/tools, blank keep, explicit replace/clear, environment fallback disabling, stale revisions, owner checks, local WAV staging, explicit rights/upload/cost gates, private voice creation and default selection. React component tests invoke actual handlers through react-test-renderer, not a real OS file picker. Unicode/atomic output, limits, API schema, 401/402/403/429/5xx, timeout and the unimplemented optional adapter are also covered.

## Prior evidence and user acceptance

Earlier candidate testing used an isolated official-CLI profile to install the Git bundle and load it through the actual Host ModuleLoader and Typert Gateway. The native settings slots and redacted owner save/get/clear round trip passed. That remains evidence for the unchanged integration wiring, not a fresh final-tag installation in the user's desktop profile.

The user independently confirmed that the settings page appeared after reopening DSH, and subsequently explicitly confirmed that the TTS plugin passed acceptance before requesting public MIT release. This is recorded as **user-confirmed acceptance**, not a claim that the release engineer personally reran the paid end-to-end flow or listened to every generated sample.

During rc.4 diagnosis, two existing private responses were checked locally in memory without network, transcription, playback or changes to the originals. They accepted the bounded Fish adapter with PCM preserved. No sample, original dialogue, personal path, hash or diagnostic log is included here or in fixtures. The public regressions reproduce boundary conditions with synthetic bytes.

## Interpretation and remaining limits

The general/reference WAV decoder remains strict. Only FishProvider output after completed HTTP body collection may adapt the exact 0xffffff24 / 0xffffff00 canonical PCM16 mono 44.1kHz header. [Fish documents these values for its compatible APIs](https://docs.fish.audio/developer-guide/compat/capabilities#audio-formats); the same pair was observed in the earlier native TTS responses. This does not establish when the provider introduced it.

Unknown-length data extends to response EOF. A clean but aligned premature EOF or metadata-like PCM cannot be distinguished from ordinary audio using those bytes alone. Low trailing amplitude is not proof of completeness. These limits are explicitly tested/documented. Exact digital silence does not guarantee the total audible gap, and successful parsing does not prove full spoken text, naturalness or voice similarity.

No paid Fish/DSH request, private upload, installed desktop update or DSH restart was performed for this release. No broader-platform, new-account or future-host compatibility claim is made. Re-test with your own permitted content after updating if your environment differs.
