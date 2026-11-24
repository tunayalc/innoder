# Inno Brand Theme

Updated: 2026-11-22. Member and management portals share the same login
layout, navigation shell, buttons, fields, dialogs, light/dark theme and language
preference. The association's public WordPress site is unchanged.

## Identity and References

- Identity: [Inno Dernegi](https://www.innoder.org/hakkimizda/) and the
  [original official wordmark](https://www.innoder.org/wp-content/uploads/2023/01/innoder-logo.png).
- The public site's [global theme](https://www.innoder.org/wp-content/uploads/elementor/css/post-9.css)
  sets cyan to `#00CDE5` and navy to `#2B2B5E`. Cyan marks selection;
  primary actions use navy with white text. Forms retain the self-hosted Inter font.
- In the preceding iteration, all five official sites below were inspected in Codex's in-app browser using
  screenshots and computed styles of visible controls. Measurements describe
  the observed pages, not every component in those brands' design systems.

| Reference | Observed pattern | Inno adaptation |
| --- | --- | --- |
| [DeFacto login](https://www.defacto.com.tr/Login) | Libre Franklin, regular text, flat rectangular CTA, restrained forms | Regular field values, quieter labels, neutral secondary actions |
| [Turk Telekom](https://www.turktelekom.com.tr/) | Mulish, 16 px labels, 44 px controls with 22 px radius | Comfortable touch targets; rounded font/buttons were reconsidered in the list revision |
| [Turkcell](https://www.turkcell.com.tr/) | GreycliffCF, 16 px labels, 40 px yellow pill actions | Clear primary-action emphasis, not its proprietary font or palette |
| [Vodafone](https://www.vodafone.com.tr/) | Vodafone font, 48 px pill hero actions with 24 px side padding | Comfortable mobile action dimensions, not pill geometry |
| [TurkNet](https://turk.net/) | Inter, 48 px rounded Online Islemler action, regular navigation | Neutral Inter typography, regular navigation |

No proprietary fonts, logos, marketing copy or entire page layouts were copied.
Inno remains an operational application, not a telecom storefront. Its original
black/blue/red artwork is retained.

## Operational UI Research

The latest review focused on working with records rather than storefront heroes.
Public UI examples were inspected inside Codex; documentation review is labeled
separately and does not imply access to these products' authenticated workspaces.

| Reference | Evidence inspected | Applied decision |
| --- | --- | --- |
| [Linear refresh](https://linear.app/changelog/2026-03-12-ui-refresh) and [design rationale](https://linear.app/now/behind-the-latest-design-refresh) | Official text and before/after UI images | Quieter sidebar, compact controls, fewer filled status blocks |
| [GitHub Issues](https://github.com/react/react/issues) | Actual public issue list and computed title styles | Stronger primary text, smaller metadata, compact rows and status icons |
| [Atlassian table](https://atlassian.design/components/table/examples/) | Official table examples/documentation | Aligned columns and semantic selection controls |
| [IBM Carbon data table](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/components/data-table/usage.mdx) | Official source documentation; public design site did not resolve | Full-width working table and grouped search/filter/batch controls |
| [GOV.UK table](https://design-system.service.gov.uk/components/table/) | Official component documentation | Clear headers and scan-friendly, restrained data presentation |
| [Airtable list view](https://support.airtable.com/articles/8391007562-list-view-overview) | Official list documentation and public Interface Designer page | Record details remain one action away; checkbox batch actions remain explicit |
| [Vercel project management](https://vercel.com/docs/projects/managing-projects) | Official documentation and embedded dashboard screenshot | Compact utility controls with neutral secondary actions |
| [Notion table view](https://www.notion.com/help/guides/table-view-databases) | Official guide, not a signed-in workspace | List/detail separation and clear filtering |

The applicant list no longer repeats initial avatars or large yellow/green
badges. Rows have a 62 px baseline with 14 px names and 12 px metadata; long
content can grow rather than being clipped. Stages use a small icon plus their
full label, and decisions use a dot plus text. The outcome is not color-only.
Stage filters use an underline, with the current result count beside filters.
CSV (all/filtered/selected), XLSX and selected-document ZIP remain available.

## Shared Rules

- Light: neutral off-white page, white controls, deep ink text, navy actions.
- Dark: neutral charcoal page and surfaces, light text, accessible blue accents.
- Primary blue is darker than the logo blue to retain readable white labels.
  Red remains in the logo and error/destructive states; green/amber describe
  semantic outcomes, not decorative sections.
- The unchanged wordmark sits on a white nameplate in dark mode. Do not tint,
  stretch or invert the original artwork.
- Inter 400 for body/input values, 500 for labels/navigation, 600 for actions
  and section headings, 700 for page headings/selected items. Letter spacing is
  zero. Heavy existing mobile text uses the bundled bold face, not synthetic 800.
- Native main actions retain 48 px minimum height, 16 px labels and 8 px corners.
  Desktop web actions use 40 px height, 14 px labels and 6 px corners; narrow
  screens use at least 44 px controls and 16 px field text. Login actions are
  52-54 px. Fields use 6-8 px corners. Tool buttons have 6 px corners.
- Repeated items and dialogs use at most 8 px corners. Screen headers and page
  sections are unframed. No decorative nested cards or gradient backgrounds.
- Primary buttons represent actions; secondary buttons use a neutral border.
  Selected filters, disabled/loading states and keyboard focus remain explicit.
- Native icon controls are 44 px; desktop table actions are 40 px. Long labels wrap.
  Responsive list headings wrap as a unit and counts never shrink; tables
  scroll inside their own region instead of widening the page.

## Font Distribution

- Source: [Google Fonts Inter](https://github.com/google/fonts/tree/main/ofl/inter),
  downloaded 2026-11-13, under [SIL OFL 1.1](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt).
- Upstream `Inter[opsz,wght].ttf` was converted with fontTools 4.60.2 to WOFF2 for
  the web, preserving the complete character set and variable weight axis.
- Static 400/500/600/700 faces were generated with
  `fonttools varLib.instancer INPUT opsz=14 wght=WEIGHT --static --update-name-table
  --no-recalc-timestamp -o OUTPUT`. Filenames match their PostScript names:
  `Inter-Regular/Medium/SemiBold/Bold`, for both native platforms. Web optical
  sizing is disabled to match the native 14-point optical instance.
- Web assets in `admin-web/public/fonts/` are self-hosted and preloaded. There
  is no runtime Google Fonts request. Mobile faces live in `src/assets/fonts/`.
- Android uses AGP's generated-source API and a synchronizing task per variant,
  so both asset packaging and lint depend on font generation; stale font files
  are not retained in the generated destination. iOS resources and UIAppFonts register
  the same faces. The license is distributed in web, Android and iOS resources.
- `withTypography` leaves layout-only styles, color overrides and explicit icon
  font families untouched. No global Text monkey-patching is used.

## Implementation and Checks

- Mobile colors: `src/theme/colors.ts`; web tokens: `admin-web/src/styles.css`.
- `admin-web/tests/theme.test.mjs` checks the shared token contract, including
  pressed/hover colors. `src/theme/colors.test.ts` checks text/status contrast
  (4.5:1) and field boundary contrast (3:1).
- Mobile component tests cover enabled/disabled/loading behavior, pressed
  primary/secondary buttons in both themes and unchanged wordmark proportions.
- Typography tests cover weight mapping, nonmutation and color-only overrides.
  Web tests check local preload, license, font signatures and native registration.
  The Android APK and AAB are inspected for all four bundled faces.
- The public support, deletion and password-reset pages follow the operating
  system's light/dark preference. Mobile and admin retain their explicit theme
  controls and saved preferences.
- Browser verification uses Codex's in-app browser with synthetic local data.
  Current evidence and remaining release gates are in `QA_STORE_READINESS.md`.
