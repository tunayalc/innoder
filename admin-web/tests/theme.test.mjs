import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import ts from 'typescript';

const mobile = readFileSync(
  new URL('../../src/theme/colors.ts', import.meta.url),
  'utf8',
);
const exports = {};
runInNewContext(
  ts.transpileModule(mobile, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const light = css.match(/:root\s*\{([\s\S]+?)\}/)[1];
const dark = css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]+?)\}/)[1];
const keys = {
  bg: 'background',
  surface: 'cardBg',
  'surface-high': 'rowBg',
  text: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  border: 'borderLight',
  'border-strong': 'outline',
  primary: 'primary',
  'primary-hover': 'primaryPressed',
  'on-accent': 'primaryText',
  'accent-bg': 'primarySoft',
  info: 'onInfo',
  'info-bg': 'info',
  hero: 'heroBg',
  'hero-text': 'heroText',
  'hero-muted': 'heroMuted',
  'hero-track': 'heroTrack',
  green: 'onSuccess',
  'green-bg': 'success',
  rose: 'onError',
  'rose-bg': 'error',
  warning: 'onWarning',
  'warning-bg': 'warning',
};

for (const [name, block, colors] of [
  ['light', light, exports.lightColors],
  ['dark', dark, exports.darkColors],
]) {
  test(`${name} web design tokens match the mobile theme`, () => {
    for (const [web, native] of Object.entries(keys)) {
      const value = block.match(new RegExp(`--${web}:\\s*([^;]+);`))?.[1];
      assert.equal(value?.toLowerCase(), colors[native].toLowerCase(), web);
    }
  });
}

test('production CSP allows authenticated blob previews without enabling object embeds', () => {
  const config = readFileSync(
    new URL('../nginx.conf', import.meta.url),
    'utf8',
  );
  assert.match(config, /frame-src blob:/);
  assert.match(config, /object-src 'none'/);
});

test('Inter is self-hosted, preloaded, and distributed with its license', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const font = readFileSync(new URL('../public/fonts/Inter-Variable.woff2', import.meta.url));
  const license = readFileSync(new URL('../public/fonts/OFL.txt', import.meta.url), 'utf8');
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.match(css, /@font-face\s*\{[^}]*font-family: 'Inter'/);
  assert.match(css, /src: url\('\/fonts\/Inter-Variable.woff2'\)/);
  assert.match(html, /rel="preload"[^>]*Inter-Variable.woff2[^>]*crossorigin/);
  assert.match(license, /SIL OPEN FONT LICENSE/);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/);
});

test('mobile font families match bundled Android and iOS resources', () => {
  const typography = readFileSync(new URL('../../src/theme/typography.ts', import.meta.url), 'utf8');
  const plist = readFileSync(new URL('../../ios/InnoPrototype/Info.plist', import.meta.url), 'utf8');
  const project = readFileSync(new URL('../../ios/InnoPrototype.xcodeproj/project.pbxproj', import.meta.url), 'utf8');
  const gradle = readFileSync(new URL('../../android/app/build.gradle', import.meta.url), 'utf8');
  for (const face of ['Regular', 'Medium', 'SemiBold', 'Bold']) {
    const name = `Inter-${face}`;
    const font = readFileSync(new URL(`../../src/assets/fonts/${name}.ttf`, import.meta.url));
    assert.equal(font.readUInt32BE(0), 0x00010000);
    assert.ok(typography.includes(`'${name}'`));
    assert.ok(plist.includes(`<string>${name}.ttf</string>`));
    assert.ok(project.includes(`../src/assets/fonts/${name}.ttf`));
    assert.ok(project.includes(`${name}.ttf in Resources`));
  }
  assert.match(gradle, /variant\.sources\.assets\.addGeneratedSourceDirectory\(copyFonts\)/);
  assert.match(gradle, /fileSystemOperations\.sync/);
  assert.match(gradle, /include 'Inter-\*\.ttf', 'OFL\.txt'/);
  assert.match(project, /OFL.txt in Resources/);
});
