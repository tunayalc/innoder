import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// Render the real view and controls with only network hooks replaced.
const renderView = page => {
  const cache = new Map();
  const mocks = {
    './api': { api: {} },
    './workflows': {},
    './hooks': { useCollection: () => ({ items: [], error: '' }) },
    './usePage': {
      usePage: () => ({
        items: [],
        total: 0,
        loading: false,
        error: '',
        load() {},
        ...page,
      }),
    },
  };
  const load = name => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith('./')) return require(name);
    if (cache.has(name)) return cache.get(name);
    const extension = ['./applications', './ui', './ApplicationDocumentUpload', './ScanPages'].includes(name) ? 'tsx' : 'ts';
    const source = readFileSync(
      new URL(`../src/${name.slice(2)}.${extension}`, import.meta.url),
      'utf8',
    );
    const exports = {};
    cache.set(name, exports);
    runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
      { exports, require: load, URLSearchParams },
    );
    return exports;
  };
  return renderToStaticMarkup(
    React.createElement(load('./applications').ApplicationsView),
  );
};

test('compact application view retains search, stage filters, exports and accessible selection', () => {
  const html = renderView({
    items: [
      {
        id: 'application-1',
        userId: 'user-1',
        personalInfo: { fullName: 'Deniz Yılmaz' },
        candidateEmail: 'deniz@example.test',
        status: 'application_stage',
        decisionStatus: 'active',
        programName: 'ESC Programı',
        updatedAt: '2026-11-13T10:00:00Z',
      },
    ],
    total: 1,
  });
  assert.match(html, /aria-label="Aday, e-posta veya program ara"/);
  assert.equal((html.match(/aria-pressed=/g) || []).length, 4);
  for (const value of [
    'all:csv',
    'filtered:csv',
    'filtered:xlsx',
    'selected:csv',
    'selected:xlsx',
  ]) {
    assert.ok(html.includes(`value="${value}"`));
  }
  assert.match(html, /aria-label="Deniz Yılmaz başvurusunu seç"/);
  assert.match(html, /aria-label="Deniz Yılmaz başvurusunu aç"/);
  assert.match(html, /class="stage-label application_stage"/);
  assert.match(html, /class="decision-label active"/);
  assert.match(html, /Başvuru Aşaması/);
  assert.doesNotMatch(html, /class="avatar|class="badge|class="stage-count/);
});

test('application errors retain an alert and retry action instead of an ordinary empty state', () => {
  const html = renderView({ error: 'Bağlantı kurulamadı' });
  assert.match(html, /role="alert"/);
  assert.match(html, /Başvurular yüklenemedi/);
  assert.match(html, /Tekrar dene/);
});

test('loading application list exposes its busy state and disables export', () => {
  const html = renderView({ loading: true });
  assert.match(html, /aria-label="Başvuru listesi"[^>]*aria-busy="true"/);
  assert.match(html, /<select aria-label="Dışa aktar" disabled=""/);
});
