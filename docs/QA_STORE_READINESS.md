# Quality and Store Readiness

Local verification: 2026-11-13. This is a verification record, not a store
approval or a production deployment. Existing candidate data was not changed.

## Passed

| Check | Result |
| --- | --- |
| Mobile TypeScript and ESLint | Passed |
| Mobile Jest | 64 tests |
| API with real isolated PostgreSQL | 36 tests |
| Web tests and both TypeScript configurations | 67 tests |
| Compiled Android manifest guard tests | 10 tests |
| API production build and JPEG/PNG runtime import checks | Passed |
| Web production build | Passed |
| Android release APK and AAB, arm64-v8a | Built unsigned for verification |
| Compiled Android manifest | API 36+, no debug/cleartext/backup, optional camera, private unique providers, document viewers |
| Android ZIP and ELF alignment | 16 KB ZIP check and 17 native libraries passed |
| Android emulator, API 36 | Earlier verification APK cold-launched; predates current typography/list revision |
| iOS production JavaScript bundle and assets | Passed; not a native Xcode archive |
| npm audit: API / web | 0 reported vulnerabilities in each dependency tree |
| npm audit: mobile toolchain | 9 low, 0 moderate/high/critical; see exception below |

JavaScript tests total 167 after the compact-list/Inter revision; the
10 Python manifest tests from the preceding verification are counted separately.
The latest local run is recorded in ignored `output/qa/workspace-ui-check.log`.
The earlier broader native verification remains in `output/qa/check-all-2026-11-13.log`.

## Workflow Coverage

- Registration, admin approval, temporary password restriction, forced password
  change and revoked sessions are exercised against PostgreSQL/Fastify.
- Profile clearing, revision conflicts, document versions, invalid/oversized
  uploads, private file access and original document receipt are covered.
- Submission, mobility and return stages retain their separate rejection
  decision. Legacy boarding pass requirements stay independent.
- XLSX is opened as an actual workbook. ZIP archives are decompressed and their
  PDF contents checked. Candidate access to admin exports is denied.
- Failed file deletion remains pending and retryable. A 1,000-application test
  checks bounded pages without loading every conversation.
- Mobile/web client tests cover stale responses, refresh sharing, failed writes,
  preserved drafts and accessible control states. Public support/deletion links
  and reset token escaping/cache behavior are covered by API tests.

## Visual Evidence

### Current Compact List Revision

The current design was verified in Codex's in-app browser at actual reported
widths of 987, 1720, 466 and 382 CSS pixels. The explicit viewport overrides do
not map one-to-one to CSS pixels in this browser, so these are measured widths,
not exact device-size certifications. No whole-page horizontal overflow was
observed; wide tables and stage filters retain their own horizontal scrolling.
Search, empty stage filtering, clearing filters, row selection, selected-export
availability, all-record CSV download, detail opening, pagination, light/dark
themes and narrow advanced filters were checked against the isolated local API.
The observed browser console had no errors/warnings at completion.

- `output/qa/inno-workspace-preview.jpg`
- `output/qa/inno-workspace-light.jpg`
- `output/qa/inno-workspace-dark.jpg`
- `output/qa/inno-workspace-narrow.jpg`

Android unsigned release APK/AAB builds passed for arm64 with all four Inter
faces and OFL verified inside both archives; the previous Mulish files are no
longer packaged. A missing generated-assets task dependency discovered during
inspection was corrected using AGP's per-variant generated-source API. The build
record is `output/qa/workspace-android-build.log`. iOS project/plist syntax passed,
but no native iOS archive or new mobile-device visual acceptance was performed.

### Earlier Evidence

The preceding typography/control revision was inspected at actual reported widths
of 987, 1548 and 419 CSS pixels. Checks covered light/dark lists, the program
creation form, mobile navigation and login. There was no whole-page horizontal
overflow at those widths. Sources and applied patterns are in `BRAND_THEME.md`.

- `output/qa/inno-reference-light.jpg`
- `output/qa/inno-reference-dark.jpg`
- `output/qa/inno-reference-login-narrow.jpg`

Android release-mode unsigned APK/AAB builds were rerun for that revision, with
its Mulish faces and license verified in the package before replacement by Inter. Native iOS
project/plist syntax was validated. The earlier emulator screenshot below
predates the new font/button revision; it is not visual proof of the new native
theme. A new full native device check is still required.

The new theme was inspected in Codex's in-app browser against an isolated local
API with 50 synthetic applications, not intercepted production responses.
Checks covered desktop light/dark, narrow navigation, the detail drawer, program
editor and sending a local test message. The browser's narrow viewport reported
419 CSS pixels despite a 390-pixel override request; do not treat this run as an
exact 320/390-pixel device certification. Page width did not overflow that
reported viewport; wide tables retain their own horizontal scrolling.

- `output/qa/inno-web-light.jpg`
- `output/qa/inno-web-dark.jpg`
- `output/qa/android/inno-theme-light.png`

The Android APK installed on the emulator is a release-mode verification copy
signed with the development key solely for installation. It is **not** a store
artifact. The unsigned originals remain under `android/app/build/outputs/`.
The explicit `innoUnsignedVerification` flag cannot be combined with
`innoStoreRelease`. CI also rejects missing institutional signing.

## Remaining Gates

1. Institutional Apple/Google developer enrollment, upload signing key and Apple
   distribution profiles still require the institution. No store upload occurred.
2. Full Xcode is unavailable locally. The iOS native archive, device checks and
   signing must run on a configured Xcode machine. Adding a CI job does not prove
   that the remote job has run.
3. This local Android native build verifies arm64 only. CI is configured for the
   default architectures; its remote results must also pass before submission.
4. Full device acceptance still includes authenticated Android/iOS workflows,
   camera/gallery, secure storage, PDF viewing/sharing, large text, screen readers
   and dark/light rendering on actual devices. Emulator entry-screen inspection
   and JavaScript tests do not certify all those interactions.
5. The privacy page remains an explicitly marked draft. Institution-approved
   legal text, App Privacy/Data Safety declarations, review accounts and final
   store screenshots must match the final signed app.
6. Production SMTP, offsite backups, restoration and alert delivery were not
   reverified in this run. The new `/support` page is implemented locally and
   must be deployed and checked over public HTTPS before shipping the app.
7. No code push or live deployment was performed in this pass. Publish through
   the existing backed-up/rollback-capable Natro workflow after review.

## Toolchain Exception

The remaining npm advisory is the low-severity `deepmerge` prototype-poisoning
report propagated through Jest and React Native CLI. npm currently proposes
incompatible major downgrades of those development tools. No forced downgrade
was applied. Recheck the advisory and adopt a compatible upstream fix before
release when available; this is not a claim that every dependency is risk-free.

## Repeatable Commands

```sh
npm run check:all
python3 -m unittest discover -s scripts -p 'test_*.py'
npm --prefix server run build
npm --prefix admin-web run build
```

From `android/`, build unsigned verification artifacts:

```sh
./gradlew app:assembleRelease app:bundleRelease -PinnoUnsignedVerification=true
```

The CI workflow then validates the merged manifest, native library alignment and
ZIP alignment. Store artifacts must instead use institutional signing with
`-PinnoStoreRelease=true`, never the verification flag or the development key.
