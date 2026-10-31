# Public release engineering review

Review date: 2026-10-31. Target: **zeola0187/dsh-character-voice-studio** only. Release: **0.1.0**, based on rc.4 commit `42b0b90fc3c4f3ecf07f575d9257ff11e5d9776b`.

## Conclusion and scope

No blocking license incompatibility, undisclosed third-party asset, real credential, private audio or private configuration was found within the reviewed repository and release package. The repository's own implementation may be released under MIT with the third-party notices retained. This is a bounded engineering license/provenance review, not a legal opinion, a proof of worldwide originality or a guarantee about future user content.

The owner explicitly requested MIT and public release after confirming acceptance. The existing Git author identity is Zeolas, matching account zeola0187; LICENSE uses that identity without adding an email. Existing Git author/committer metadata is retained and will be public with the history. No history was rewritten.

## History and privacy

- The non-shallow baseline contains seven commits and 62 distinct historical blobs. Remote inventory contains only main and the annotated v0.1.0-rc.1 / v0.1.0-rc.2 tags; local refs match the remote. Commit and tag messages were inspected as well as historical paths and blob contents.
- No existing GitHub releases, release assets or Actions workflows were present at review. The final release adds its documentation/metadata commit and v0.1.0 without moving old tags.
- All historical file types are text source, generated JavaScript, synthetic tests, package metadata, scripts or documentation. No actual WAV/MP3, diagnostic binary, voice reference, original drama, output, personal absolute path, private configuration, credential-bearing remote, private log, model weight or artwork was found. Documentation contains generic environment-variable locations and an older installation example; these are not private material.
- A credential-like hit in the native settings probe was manually verified as an explicit synthetic test marker. Automated scanning never accesses the user's live configuration or account credentials. Standard public upstream copyright attribution is preserved.
- `npm run audit:public` checks all local refs, messages, historical blobs and nonignored working files, reporting only file/line/type on a hit. It checks known credential patterns, literal key assignments, personal paths, embedded audio, binary contents and forbidden data paths. Pattern scanning has false negatives; the small repository's inventory and provenance were also inspected. It is not a general-purpose secret detector or a guarantee of absence.
- Ignored local test outputs and dependencies are excluded from the published Git tree and package allowlist. No private sample was copied into fixtures or release assets. `.gitignore` additionally excludes diagnostic `.bin` files.

## Code and dependency rights

The implementation was produced for this project using documented Fish HTTP contracts and DSH public integration APIs. The history begins with this plugin's implementation, rather than an imported application. No substantial third-party implementation, SDK, official example dialogue, stock voice, logo, font, image or model was found in the tracked tree. Short independently written test dialogue and synthesized PCM fixtures do not reproduce the user's source material. This review cannot prove that every short coding idiom is unique.

The checked lockfile's entire installed dependency closure is:

| Package | Version | Role | License |
| --- | --- | --- | --- |
| zod | 4.6.7 | Runtime; no transitive dependencies | MIT |
| react | 18.3.1 | Development; client uses host external | MIT |
| react-test-renderer | 18.3.1 | Development | MIT |
| react-is | 18.3.1 | Development transitive | MIT |
| react-shallow-renderer | 16.15.0 | Development transitive | MIT |
| scheduler | 0.23.2 | Development transitive | MIT |
| loose-envify | 1.4.0 | Development transitive | MIT |
| js-tokens | 4.0.0 | Development transitive | MIT |
| object-assign | 4.1.1 | Development transitive | MIT |

Each installed package's LICENSE was read and preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), rather than relying only on package.json labels. Exact sources/integrity are pinned in package-lock.json. `lib/client.js` is assembled from this project's functions; React and Zod remain external, not embedded third-party code. The plugin archive does not bundle node_modules or a DSH distribution.

The optional DSH tools and Typert peer APIs are supplied by the separately installed **DSH 0.2.1-rc.5** host. DSH's [MIT license](https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE) and [third-party notices](https://github.com/deepseek-ai/deepseek-harness/blob/master/THIRD_PARTY_NOTICES.md) were checked. Conservative DeepSeek attribution is included for public API integration patterns. This does not relicense the host's dependencies. The [DSH brand guidelines](https://github.com/deepseek-ai/deepseek-harness/blob/master/BRAND_GUIDELINES.md) recommend the abbreviated DSH name; this project uses no official logo and explicitly disclaims official endorsement.

## Fish service boundary

Fish is accessed by HTTPS; no Fish SDK source, model or voice is redistributed. API field names, endpoint paths and the bounded WAV placeholder constants implement interoperability; the documentation is linked, not republished wholesale. [Drama 3 documentation](https://docs.fish.audio/features/text-to-speech/drama-3) confirms the model header and direction syntax. The [WAV compatibility documentation](https://docs.fish.audio/developer-guide/compat/capabilities#audio-formats) documents the exact placeholder values, with its compatible-API scope explicitly distinguished in the test report.

The [Fish Terms of Service](https://fish.audio/terms/) govern accounts, fees, submitted content and service use. Users must provide their own account/key and the necessary rights to recordings, text and voice/likeness. Commercial use depends on the applicable service plan and terms. MIT does not grant those rights or replace Fish's terms. Private visibility does not make uploaded data local: Fish still processes it under its terms and [privacy policy](https://fish.audio/privacy/). Pricing and legal terms may change; consult the service before use. The release does not certify any user's audio rights or output's suitability for publication.

## Verification and release boundary

See [TEST-RESULTS.md](TEST-RESULTS.md) for actual execution and [HANDOFF.md](HANDOFF.md) for installation. Full offline tests, source/lib checks, history scan and package checks are the release gate. The user confirmed functional acceptance; the release engineer did not repeat paid generation, upload audio, modify a desktop profile or restart DSH. Other DSH versions and platforms remain unverified.
