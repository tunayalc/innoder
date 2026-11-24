# Mobile and Web UI Refresh

## 2026-11-13 Inno Identity Update

- Replaced purple accents with the association's original black/blue/red identity
  and shared neutral light/dark surfaces. See `BRAND_THEME.md` for references.
- Updated the real logo, control geometry, screen headers, fields, pressed states
  and mobile accent/white contrast. Existing workflows and theme selection remain.
- Latest local evidence and release limitations: `QA_STORE_READINESS.md`.
- The historical deployment records below do not mean this new theme is live.

## 2026-10-19 Workflow Release

- Latest checks: 43 mobile, 34 API and 62 web tests pass (139 total), plus typecheck/lint and web/API production builds. Both Metro production bundles build; this does not certify native APK/AAB/IPA signing or device behavior.
- Browser checks used a real local API and isolated PostgreSQL with synthetic records, not production fixtures or intercepted API responses: 50 applications, program editing/assignment, conversation summaries, message send/read, desktop 1440x1000 and narrow 390x844/320x740 layouts. No horizontal overflow was measured; a delivered message clears its draft. Theme transitions were allowed to finish before final screenshots.
- Screenshots include `applications-desktop-final.png`, `program-editor-mobile.png` and `messages-mobile-dark-final.png` under ignored `output/playwright/`.
- Natro API and web were deployed after encrypted backup and isolated restore checks. Public HTTPS health and new frontend assets were checked without a production browser login. Authenticated API smoke checks were read-only; no production candidate/application was created.
- Native camera/gallery/secure-storage/share flows, complete bilingual and large-text acceptance, institutional signing/accounts, SMTP delivery, offsite backup and alert channels remain separate release gates. See `IMPLEMENTATION_PROGRESS.md` for the security/toolchain exceptions and deployment record.

## Previous UI Pass

Validated locally on 2026-09-21. No production deployment or production records were changed.

## Scope

- Mobile and web use matching neutral surfaces, purple actions, semantic stage/status colors and light/dark palettes.
- Mobile shared controls now have consistent sizing, accessible labels, readable contrast, loading states and safe-area/keyboard support. Authentication, candidate, admin, settings, document and message screens use the updated system.
- The web admin includes responsive navigation, filtering, pagination, bulk selection, authenticated PDF/image previews and in-app confirmation/password forms.
- Session refresh, downloads, error recovery, modal focus/scroll handling and stale responses were hardened.
- Failed mobile message sends preserve the draft; repeated sends are blocked while pending.

## Automated Checks

- `npm run check:all`: typecheck and lint pass; 27 mobile tests, 7 server tests and 59 web tests pass (93 total).
- `npm --prefix admin-web run build`: pass.
- `npm --prefix server run build`: pass.
- Android debug build, installation and launch: pass on InnoPixel.
- Android `assembleRelease`: pass using the existing local test signing setup, not a store distribution signature.
- One initial local Jest invocation exited with a native process crash (139); subsequent complete and repeated isolated suites passed.
- Web theme contract tests check color parity against `src/theme/colors.ts`.

## Browser Verification

Used an isolated Playwright Chrome session with synthetic fixtures. All `/api/**` requests were intercepted; no real account or document was modified.

Checked desktop 1440x1000 and narrow 390x844 / 320x740 views, light/dark appearance, no page-level horizontal overflow, sidebar keyboard navigation, empty search results, email search from candidate accounts, stage/decision filters, select-all, pagination, download error feedback, password validation, administrator creation, audit search, stage transitions, rejection preserving stage, original-document receipt, image/PDF preview, nested Escape handling, theme persistence, transient startup failure recovery and scroll restoration on session expiry.

Screenshots are in the ignored `output/playwright/` directory, including `web-applications-final.png`, `web-applications-final-dark.png`, `web-detail-final-mobile.png`, `web-pdf-preview.png` and `android-login.png`.

To use the browser fixtures, open the local dev page with the Playwright CLI, then run `run-code --filename admin-web/tests/browser-fixtures.js`. These fixtures are not imported by the application or included in its production bundle.

## Local Preview

The default Vite API proxy is `http://localhost:3000`. For an explicit live-API preview, run `INNO_API_PROXY=https://api.innoder.org npm --prefix admin-web run dev -- --host 127.0.0.1`. This only selects the development proxy; it does not deploy anything. Signing in and performing actions through that non-fixture preview uses real server data.

## Remaining Release Validation

- iOS build and real-device verification were not possible in the current Xcode environment.
- Authenticated mobile workflows, tablet layouts and large-text modes still need device-level acceptance testing.
- SMTP, store signing, production operations and other outstanding deployment requirements are outside this UI change and are not certified by these checks.
