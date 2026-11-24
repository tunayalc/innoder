import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { registerPublicRoutes } from './routes/publicRoutes.js';

test('publishes the privacy policy and account deletion information without authentication', async t => {
  const app = Fastify();
  t.after(() => app.close());
  registerPublicRoutes(app);

  const privacy = await app.inject({ url: '/privacy' });
  assert.equal(privacy.statusCode, 200);
  assert.match(privacy.headers['content-type'] ?? '', /^text\/html/);
  assert.equal(privacy.headers['cache-control'], 'no-cache');
  assert.match(privacy.body, /Gizlilik Politikası ve KVKK Aydınlatma Metni/);
  assert.match(privacy.body, /Rızamı geri al/);
  assert.match(privacy.body, /innodernegi@gmail\.com/);
  assert.match(privacy.body, /href="\/account-deletion"/);
  assert.doesNotMatch(privacy.body, /nihai KVKK aydınlatma metni henüz yayımlanmamıştır/);

  const deletion = await app.inject({ url: '/account-deletion' });
  assert.equal(deletion.statusCode, 200);
  assert.match(deletion.body, /Hesap Silme Talebi/);
});
