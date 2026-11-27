import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import EmbeddedPostgres from 'embedded-postgres';
import { PDFDocument } from 'pdf-lib';
import ExcelJS from 'exceljs';
import { unzipSync } from 'fflate';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import {
  hashPassword,
  signAccessToken,
  createOpaqueToken,
  hashToken,
} from './security.js';
import { runCleanupJobs } from './cleanup.js';

test(
  'real PostgreSQL API workflow and isolation',
  { timeout: 120000 },
  async t => {
    const directory = await mkdtemp(join(tmpdir(), 'inno-integration-'));
    const embedded = process.env.TEST_DATABASE_URL
      ? undefined
      : new EmbeddedPostgres({
          databaseDir: join(directory, 'pg'),
          port: 54861,
          user: 'postgres',
          password: 'local-test-only',
          persistent: false,
          onLog: () => undefined,
          onError: () => undefined,
        });
    let db: pg.Pool | undefined;
    let app: Awaited<ReturnType<typeof buildApp>> | undefined;
    try {
      if (embedded) {
        await embedded.initialise();
        await embedded.start();
      }
      const url =
        process.env.TEST_DATABASE_URL ||
        'postgresql://postgres:local-test-only@localhost:54861/postgres';
      db = new pg.Pool({ connectionString: url });
      const schema = `test_${Date.now()}`;
      await db.query(`CREATE SCHEMA ${schema}`);
      await db.end();
      db = new pg.Pool({
        connectionString: url,
        options: `-c search_path=${schema},public`,
      });
      for (const file of (
        await readdir(new URL('../migrations', import.meta.url))
      )
        .filter(name => /^\d+_.+\.sql$/.test(name))
        .sort())
        await db.query(
          await readFile(
            new URL(`../migrations/${file}`, import.meta.url),
            'utf8',
          ),
        );
      const config = loadConfig({
        NODE_ENV: 'test',
        DATABASE_URL: url,
        JWT_SECRET: 'integration-test-secret-not-for-production',
        ESC_BLOOD_GROUP_KEY: Buffer.alloc(32, 1).toString('base64'),
        FILE_STORAGE_PATH: join(directory, 'documents'),
      });
      const hash = await hashPassword('LocalTestPassword123');
      const users = (
        await db.query(
          `INSERT INTO users(name,email,role,status,password_hash,must_change_password) VALUES
      ('Super','super@test.invalid','super_admin','active',$1,false),('Candidate','candidate@test.invalid','candidate','active',$1,false),
      ('Other','other@test.invalid','candidate','active',$1,false),('Temporary','temporary@test.invalid','candidate','active',$1,true) RETURNING *`,
          [hash],
        )
      ).rows;
      const [admin, candidate, other, temporary] = users;
      assert.ok(admin && candidate && other && temporary);
      const token = async (row: Record<string, any>) =>
        signAccessToken(config, {
          id: row.id,
          role: row.role,
          tokenVersion: row.token_version,
        });
      const headers = { authorization: `Bearer ${await token(admin)}` },
        candidateHeaders = {
          authorization: `Bearer ${await token(candidate)}`,
        };
      app = await buildApp(config, db);
      const api = app;
      let programId = '',
        applicationId = '',
        firstDocument = '';
      await t.test('registration, approval, forced password change and session revocation form one workflow', async () => {
        const registration = { name: 'Lifecycle Candidate', email: 'lifecycle@test.invalid', noticeAccepted: true, noticeVersion: 'qa-v1', consentAccepted: true, consentVersion: 'qa-v1' };
        const registered = await api.inject({ method: 'POST', url: '/api/auth/register', payload: registration });
        assert.equal(registered.statusCode, 201, registered.body);
        const id = registered.json().user.id;
        assert.equal(registered.json().user.status, 'pending');
        assert.equal((await api.inject({ method: 'POST', url: '/api/auth/register', payload: registration })).statusCode, 409);
        assert.equal((await api.inject({ method: 'POST', url: '/api/auth/register', payload: { ...registration, email: 'missing-consent@test.invalid', consentAccepted: false } })).statusCode, 400);
        const temporaryPassword = 'LifecycleTemporary123';
        const unapproved = await api.inject({ method: 'POST', url: `/api/admin/candidates/${id}/temporary-password`, headers, payload: { password: temporaryPassword, eventLinkApproved: false } });
        assert.equal(unapproved.statusCode, 400, unapproved.body);
        assert.equal((await db!.query('SELECT status FROM users WHERE id = $1', [id])).rows[0].status, 'pending');
        const approved = await api.inject({ method: 'POST', url: `/api/admin/candidates/${id}/temporary-password`, headers, payload: { password: temporaryPassword, eventLinkApproved: true } });
        assert.equal(approved.statusCode, 200, approved.body);
        assert.equal(approved.json().user.mustChangePassword, true);
        assert.equal(JSON.stringify(approved.json()).includes(temporaryPassword), false);
        const login = async (password: string) => api.inject({ method: 'POST', url: '/api/auth/login', remoteAddress: '192.0.2.41', payload: { email: registration.email, password } });
        const first = await login(temporaryPassword);
        assert.equal(first.statusCode, 200, first.body);
        const temporaryHeaders = { authorization: `Bearer ${first.json().accessToken}` };
        assert.equal((await api.inject({ url: '/api/applications', headers: temporaryHeaders })).statusCode, 403);
        const changed = await api.inject({ method: 'POST', url: '/api/auth/change-password', headers: temporaryHeaders, payload: { currentPassword: temporaryPassword, newPassword: 'LifecyclePermanent123' } });
        assert.equal(changed.statusCode, 200, changed.body);
        assert.equal((await api.inject({ url: '/api/auth/me', headers: temporaryHeaders })).statusCode, 401);
        assert.equal((await login(temporaryPassword)).statusCode, 401);
        const signedIn = await login('LifecyclePermanent123');
        assert.equal(signedIn.statusCode, 200, signedIn.body);
        const candidateSession = { authorization: `Bearer ${signedIn.json().accessToken}` };
        assert.equal((await api.inject({ url: '/api/admin/admins', headers: candidateSession })).statusCode, 403);
        const profile = await api.inject({ method: 'PATCH', url: '/api/users/me', headers: candidateSession, payload: { name: 'Lifecycle Candidate', nationality: 'Germany', identityType: 'passport', passportNumber: 'QA987654', bloodGroup: 'A+' } });
        assert.equal(profile.statusCode, 200, profile.body);
        assert.equal(profile.json().bloodGroup, undefined);
        const deleted = await api.inject({ method: 'DELETE', url: '/api/users/me', headers: candidateSession });
        assert.equal(deleted.statusCode, 202, deleted.body);
        assert.equal((await api.inject({ url: '/api/auth/me', headers: candidateSession })).statusCode, 401);
        assert.equal((await login('LifecyclePermanent123')).statusCode, 401);
      });
      await t.test('public support and deletion work without an account; reset tokens are not cached or executed', async () => {
        for (const path of ['/support', '/account-deletion']) {
          const result = await api.inject({ url: path });
          assert.equal(result.statusCode, 200);
          assert.match(result.body, /mailto:innodernegi@gmail.com/);
        }
        const result = await api.inject({ url: '/reset-password?token=' + encodeURIComponent('</script><script>alert(1)</script>') });
        assert.equal(result.statusCode, 200);
        assert.equal(result.headers['cache-control'], 'no-store');
        assert.ok(!result.body.includes('</script><script>alert(1)'));
        assert.match(result.body, /aria-live="polite"/);
      });
      await t.test(
        'API responses are not cached and malformed or throttled requests keep their HTTP status',
        async () => {
          const me = await api.inject({
            url: '/api/auth/me',
            headers: candidateHeaders,
          });
          assert.match(me.headers['cache-control'] || '', /no-store/);
          const malformed = await api.inject({
            method: 'POST',
            url: '/api/auth/login',
            headers: { 'content-type': 'application/json' },
            payload: '{',
          });
          assert.equal(malformed.statusCode, 400, malformed.body);
          let throttled;
          for (let index = 0; index < 181; index++)
            throttled = await api.inject({
              url: '/health/live',
              remoteAddress: '198.51.100.23',
            });
          assert.equal(throttled?.statusCode, 429, throttled?.body);
        },
      );
      await t.test(
        'temporary-password access is blocked except account and password routes',
        async () => {
          const h = { authorization: `Bearer ${await token(temporary)}` };
          assert.equal(
            (await api.inject({ url: '/api/auth/me', headers: h })).statusCode,
            200,
          );
          const blocked = await api.inject({
            url: '/api/applications',
            headers: h,
          });
          assert.equal(blocked.statusCode, 403);
          assert.equal(blocked.json().code, 'PASSWORD_CHANGE_REQUIRED');
        },
      );
      await t.test(
        'legacy checklist expands and assignment freezes the program requirements',
        async () => {
          const created = await api.inject({
            method: 'POST',
            url: '/api/programs',
            headers,
            payload: {
              name: 'ESC Test',
              year: 2026,
              checklist: [
                { documentType: 'identity', expectedFormat: 'PDF' },
                { documentType: 'boarding_pass', expectedFormat: 'PDF' },
              ],
            },
          });
          assert.equal(created.statusCode, 201, created.body);
          programId = created.json().id;
          assert.equal(created.json().checklist.length, 3);
          const assigned = await api.inject({
            method: 'POST',
            url: '/api/applications',
            headers,
            payload: { programId, userId: candidate.id },
          });
          assert.equal(assigned.statusCode, 201, assigned.body);
          applicationId = assigned.json().id;
          assert.equal(
            (
              await api.inject({
                method: 'PATCH',
                url: `/api/programs/${programId}`,
                headers,
                payload: {
                  checklist: [{ documentType: 'form', expectedFormat: 'PDF' }],
                },
              })
            ).statusCode,
            200,
          );
          const frozen = (
            await api.inject({
              url: `/api/applications/${applicationId}`,
              headers,
            })
          ).json();
          assert.equal(frozen.program.checklist[0].documentType, 'identity');
          assert.equal(
            (
              await api.inject({
                url: `/api/applications/${applicationId}`,
                headers: { authorization: `Bearer ${await token(other)}` },
              })
            ).statusCode,
            404,
          );
        },
      );
      await t.test(
        'revision conflicts return 409 and empty CV does not pass submission',
        async () => {
          const loaded = (
            await api.inject({
              url: `/api/applications/${applicationId}`,
              headers,
            })
          ).json();
          assert.equal(
            (
              await api.inject({
                method: 'PATCH',
                url: `/api/applications/${applicationId}/personal-info`,
                headers,
                payload: {
                  revision: loaded.revision + 1,
                  fullName: 'Conflict',
                },
              })
            ).statusCode,
            409,
          );
          const incomplete = await api.inject({
            method: 'POST',
            url: `/api/applications/${applicationId}/submit`,
            headers: candidateHeaders,
            payload: {},
          });
          assert.equal(incomplete.statusCode, 400);
          assert.ok(
            incomplete.json().issues.missingFields.includes('europassCv'),
          );
        },
      );
      const pdf = await PDFDocument.create();
      pdf.addPage();
      pdf.addPage();
      const bytes = Buffer.from(await pdf.save());
      const upload = async (key: string, type = 'identity') =>
        api.inject({
          method: 'POST',
          url: `/api/applications/${applicationId}/documents/${type}`,
          headers: {
            ...candidateHeaders,
            'content-type': 'multipart/form-data; boundary=TESTBOUNDARY',
            'idempotency-key': key,
          },
          payload: Buffer.concat([
            Buffer.from(
              '--TESTBOUNDARY\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
            ),
            bytes,
            Buffer.from('\r\n--TESTBOUNDARY--\r\n'),
          ]),
        });
      await t.test(
        'uploads validate real PDFs, version required documents and retain independent extra files',
        async () => {
          const first = await upload('test_upload_key_001');
          assert.equal(first.statusCode, 201, first.body);
          firstDocument = first.json().id;
          assert.equal(first.json().pageCount, 2);
          const again = await upload('test_upload_key_001');
          assert.equal(again.statusCode, 200, again.body);
          assert.equal(again.json().id, firstDocument);
          const second = await upload('test_upload_key_002');
          assert.equal(second.statusCode, 201, second.body);
          assert.equal(second.json().version, 2);
          await upload('test_upload_extra_01', 'extra');
          await upload('test_upload_extra_02', 'extra');
          const application = (
            await api.inject({
              url: `/api/applications/${applicationId}`,
              headers,
            })
          ).json();
          assert.equal(application.documents.length, 3);
          assert.equal(
            application.documents.filter(
              (doc: { type: string }) => doc.type === 'identity',
            ).length,
            1,
          );
          const history = (
            await api.inject({
              url: `/api/applications/${applicationId}/documents/history`,
              headers,
            })
          ).json();
          assert.equal(history.length, 4);
          assert.equal(
            history.find((doc: { id: string }) => doc.id === firstDocument)
              .isCurrent,
            false,
          );
          assert.equal(
            (
              await api.inject({
                url: `/api/documents/${firstDocument}/download`,
                headers: { authorization: `Bearer ${await token(other)}` },
              })
            ).statusCode,
            404,
          );
        },
      );
      await t.test(
        'admin-named documents reach existing applications, gate submission and version per key',
        async () => {
          const program = (
            await api.inject({ url: `/api/programs/${programId}`, headers })
          ).json();
          const custom = {
            documentType: 'extra',
            key: 'custom_insure01',
            label: 'Sağlık sigortası poliçesi',
            expectedFormat: 'PDF',
            description: 'Hareketlilik süresini kapsayan poliçe.',
          };
          const patch = (checklist: unknown[]) =>
            api.inject({
              method: 'PATCH',
              url: `/api/programs/${programId}`,
              headers,
              payload: { checklist },
            });
          const { key: _key, ...withoutKey } = custom;
          assert.equal(
            (await patch([...program.checklist, withoutKey])).statusCode,
            400,
          );
          assert.equal(
            (await patch([...program.checklist, custom, custom])).statusCode,
            400,
          );
          const saved = await patch([...program.checklist, custom]);
          assert.equal(saved.statusCode, 200, saved.body);
          const readApplication = async () =>
            (
              await api.inject({
                url: `/api/applications/${applicationId}`,
                headers,
              })
            ).json();
          assert.deepEqual(
            (await readApplication()).program.checklist.find(
              (item: { key?: string }) => item.key === custom.key,
            ),
            custom,
          );
          const submit = await api.inject({
            method: 'POST',
            url: `/api/applications/${applicationId}/submit`,
            headers: candidateHeaders,
          });
          assert.equal(submit.statusCode, 400, submit.body);
          assert.ok(
            JSON.stringify(submit.json()).includes(custom.label),
            submit.body,
          );
          const uploadFor = (key: string, requirement: string, type = 'extra') =>
            api.inject({
              method: 'POST',
              url: `/api/applications/${applicationId}/documents/${type}?requirement=${requirement}`,
              headers: {
                ...candidateHeaders,
                'content-type': 'multipart/form-data; boundary=TESTBOUNDARY',
                'idempotency-key': key,
              },
              payload: Buffer.concat([
                Buffer.from(
                  '--TESTBOUNDARY\r\nContent-Disposition: form-data; name="file"; filename="policy.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
                ),
                bytes,
                Buffer.from('\r\n--TESTBOUNDARY--\r\n'),
              ]),
            });
          assert.equal(
            (await uploadFor('test_custom_bad_01', 'custom_unknown1')).statusCode,
            400,
          );
          assert.equal(
            (await uploadFor('test_custom_bad_02', custom.key, 'identity')).statusCode,
            400,
          );
          const first = await uploadFor('test_custom_key_01', custom.key);
          assert.equal(first.statusCode, 201, first.body);
          assert.equal(first.json().requirementKey, custom.key);
          const second = await uploadFor('test_custom_key_02', custom.key);
          assert.equal(second.statusCode, 201, second.body);
          const current = (await readApplication()).documents.filter(
            (doc: { requirementKey?: string }) => doc.requirementKey === custom.key,
          );
          assert.deepEqual(
            current.map((doc: { id: string }) => doc.id),
            [second.json().id],
          );
          // Later checks count this application's documents.
          await db!.query(
            'DELETE FROM documents WHERE application_id = $1 AND requirement_key IS NOT NULL',
            [applicationId],
          );
          const restored = await patch(program.checklist);
          assert.equal(restored.statusCode, 200, restored.body);
          assert.equal(
            (await readApplication()).program.checklist.some(
              (item: { key?: string }) => item.key,
            ),
            false,
          );
        },
      );
      await t.test(
        'invalid, oversized and unauthorized uploads never create a document',
        async () => {
          const multipart = (content: Buffer) =>
            Buffer.concat([
              Buffer.from(
                '--UPLOAD\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
              ),
              content,
              Buffer.from('\r\n--UPLOAD--\r\n'),
            ]);
          const url = `/api/applications/${applicationId}/documents/identity`;
          const invalid = await api.inject({
            method: 'POST',
            url,
            headers: {
              ...candidateHeaders,
              'content-type': 'multipart/form-data; boundary=UPLOAD',
            },
            payload: multipart(Buffer.from('%PDF-1.7\ncorrupt')),
          });
          assert.equal(invalid.statusCode, 400, invalid.body);
          const oversized = await api.inject({
            method: 'POST',
            url,
            headers: {
              ...candidateHeaders,
              'content-type': 'multipart/form-data; boundary=UPLOAD',
            },
            payload: multipart(Buffer.alloc(20 * 1024 * 1024 + 1)),
          });
          assert.equal(oversized.statusCode, 413, oversized.body);
          const denied = await api.inject({
            method: 'POST',
            url,
            headers: {
              authorization: `Bearer ${await token(other)}`,
              'content-type': 'multipart/form-data; boundary=UPLOAD',
            },
            payload: multipart(bytes),
          });
          assert.equal(denied.statusCode, 404, denied.body);
          assert.equal(
            (
              await db!.query(
                'SELECT count(*) FROM documents WHERE application_id=$1',
                [applicationId],
              )
            ).rows[0].count,
            '4',
          );
        },
      );
      await t.test(
        'institutional templates are private real PDFs and candidate uploads are forbidden',
        async () => {
          const url = `/api/programs/${programId}/templates/activity_agreement`;
          const payload = Buffer.concat([
            Buffer.from(
              '--TEMPLATE\r\nContent-Disposition: form-data; name="file"; filename="agreement.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
            ),
            bytes,
            Buffer.from('\r\n--TEMPLATE--\r\n'),
          ]);
          const saved = await api.inject({
            method: 'POST',
            url,
            headers: {
              ...headers,
              'content-type': 'multipart/form-data; boundary=TEMPLATE',
            },
            payload,
          });
          assert.equal(saved.statusCode, 201, saved.body);
          const download = `/api/program-templates/${saved.json().id}/download`;
          assert.equal((await api.inject({ url: download })).statusCode, 401);
          const opened = await api.inject({
            url: download,
            headers: candidateHeaders,
          });
          assert.equal(opened.statusCode, 200, opened.body);
          assert.equal(
            (await PDFDocument.load(opened.rawPayload)).getPageCount(),
            2,
          );
          assert.equal(
            (
              await api.inject({
                method: 'POST',
                url,
                headers: {
                  ...candidateHeaders,
                  'content-type': 'multipart/form-data; boundary=TEMPLATE',
                },
                payload,
              })
            ).statusCode,
            403,
          );
        },
      );
      await t.test(
        'profile clearing propagates atomically without losing CV drafts',
        async () => {
          assert.equal(
            (
              await api.inject({
                method: 'PATCH',
                url: '/api/users/me',
                headers: candidateHeaders,
                payload: {
                  name: 'Updated Candidate',
                  bloodGroup: 'A+',
                  birthDate: '2000-01-01',
                  identityType: 'passport',
                  passportNumber: 'P123',
                  pnrNumber: 'LOCAL123',
                  nationality: 'Germany',
                },
              })
            ).statusCode,
            200,
          );
          assert.equal(
            (
              await api.inject({
                url: '/api/auth/me',
                headers: candidateHeaders,
              })
            ).json().birthDate,
            '2000-01-01',
          );
          for (const url of [
            '/api/admin/candidates?q=Updated%20Candidate',
            '/api/admin/candidates?page=1&pageSize=25&q=Updated%20Candidate',
          ]) {
            const response = await api.inject({ url, headers });
            assert.equal(response.statusCode, 200, response.body);
            const list = response.json();
            const summary = (list.items ?? list).find((item: { id: string }) => item.id === candidate.id);
            assert.ok(summary);
            assert.equal(summary.email, candidate.email);
            for (const key of ['bloodGroup', 'identityNumber', 'passportNumber', 'pnrNumber']) {
              assert.equal(Object.hasOwn(summary, key), false, key);
            }
          }
          const detail = await api.inject({ url: `/api/applications/${applicationId}`, headers });
          assert.equal(detail.statusCode, 200, detail.body);
          assert.equal(detail.json().personalInfo.passportNumber, 'P123');
          const cleared = await api.inject({
            method: 'PATCH',
            url: '/api/users/me',
            headers: candidateHeaders,
            payload: { bloodGroup: '', birthDate: '' },
          });
          assert.equal(cleared.statusCode, 200, cleared.body);
          assert.equal(cleared.json().bloodGroup, undefined);
          const appRow = (
            await api.inject({
              url: `/api/applications/${applicationId}`,
              headers,
            })
          ).json();
          assert.equal(appRow.personalInfo.bloodGroup, undefined);
          assert.equal(appRow.personalInfo.birthDate, '');
          await db!.query('UPDATE users SET event_link = $1 WHERE id = $2', [
            'https://example.org/qa-event',
            candidate.id,
          ]);
          const withLink = await api.inject({
            url: `/api/applications/${applicationId}`,
            headers,
          });
          assert.equal(
            withLink.json().candidateEventLink,
            'https://example.org/qa-event',
          );
          const listed = await api.inject({
            url: '/api/applications?page=1&pageSize=25',
            headers,
          });
          assert.equal(
            listed
              .json()
              .items.find((item: { id: string }) => item.id === applicationId)
              ?.candidateEventLink,
            'https://example.org/qa-event',
          );
        },
      );
      await t.test('blood group is revocable, consented and isolated to an opted-in ESC application', async healthTest => {
        const from = '192.0.2.45';
        const adminAuth = headers;
        const otherAuth = { authorization: `Bearer ${await token(other)}` };
        const valid = { bloodGroup: 'AB+', consentAccepted: true, consentVersion: 'esc-blood-group-v1' };
        const requestHealth = (id: string, method: 'GET' | 'PUT' | 'DELETE', auth = candidateHeaders, payload?: unknown) =>
          api.inject({ method, url: `/api/applications/${id}/blood-group`, headers: auth, payload: payload as object | undefined, remoteAddress: from });
        assert.deepEqual((await requestHealth(applicationId, 'GET')).json(), { available: false, consentVersion: 'esc-blood-group-v1' });
        assert.equal((await requestHealth(applicationId, 'PUT', candidateHeaders, valid)).statusCode, 409);
        const base = { name: 'ESC Consent QA', year: 2026, checklist: [{ documentType: 'form', expectedFormat: 'PDF' }] };
        const refusedProgram = await api.inject({
          method: 'POST', url: '/api/programs', headers: adminAuth, remoteAddress: from,
          payload: { ...base, programKind: 'other', collectBloodGroup: true },
        });
        assert.equal(refusedProgram.statusCode, 400);
        const program = await api.inject({
          method: 'POST', url: '/api/programs', headers: adminAuth, remoteAddress: from,
          payload: { ...base, programKind: 'esc', collectBloodGroup: true },
        });
        assert.equal(program.statusCode, 201, program.body);
        const escId = program.json().id;
        healthTest.after(async () => {
          await db!.query('DELETE FROM applications WHERE program_id = $1', [escId]);
          await db!.query('DELETE FROM programs WHERE id = $1', [escId]);
        });
        const assigned = await api.inject({
          method: 'POST', url: '/api/applications', headers: adminAuth, remoteAddress: from,
          payload: { programId: escId, userId: candidate.id },
        });
        assert.equal(assigned.statusCode, 201, assigned.body);
        const id = assigned.json().id;
        assert.equal((await requestHealth(id, 'GET', otherAuth)).statusCode, 404);
        assert.equal((await requestHealth(id, 'PUT', otherAuth, valid)).statusCode, 404);
        assert.equal((await requestHealth(id, 'PUT', adminAuth, valid)).statusCode, 403);
        assert.equal((await requestHealth(id, 'PUT', candidateHeaders, { ...valid, consentAccepted: false })).statusCode, 400);
        assert.equal((await requestHealth(id, 'PUT', candidateHeaders, { ...valid, consentVersion: 'stale' })).statusCode, 400);
        const grant = await requestHealth(id, 'PUT', candidateHeaders, valid);
        assert.equal(grant.statusCode, 200, grant.body);
        assert.equal(grant.json().bloodGroup, 'AB+');
        assert.ok(grant.json().consentedAt);
        assert.equal(grant.headers['cache-control'], 'private, no-store');
        const sealed = (await db!.query(
          'SELECT sealed_value, consent_version FROM application_blood_groups WHERE application_id = $1',
          [id],
        )).rows[0];
        assert.equal(sealed.consent_version, 'esc-blood-group-v1');
        assert.equal(Buffer.from(sealed.sealed_value, 'base64').length, 31);
        assert.notEqual(sealed.sealed_value, 'AB+');
        assert.equal((await requestHealth(id, 'GET', adminAuth)).json().bloodGroup, 'AB+');
        assert.equal((await requestHealth(id, 'DELETE', adminAuth)).statusCode, 403);
        const detail = await api.inject({ url: `/api/applications/${id}`, headers, remoteAddress: from });
        assert.equal(detail.json().personalInfo.bloodGroup, undefined);
        const revoke = await requestHealth(id, 'DELETE');
        assert.equal(revoke.statusCode, 200, revoke.body);
        assert.equal(revoke.json().bloodGroup, undefined);
        assert.equal((await requestHealth(id, 'GET', adminAuth)).json().bloodGroup, undefined);
        assert.equal((await requestHealth(id, 'DELETE')).statusCode, 200);
        assert.equal((await requestHealth(id, 'PUT', candidateHeaders, valid)).statusCode, 200);
        const change = (enable: boolean) => api.inject({
          method: 'PATCH', url: `/api/programs/${escId}`, headers: adminAuth, remoteAddress: from,
          payload: { collectBloodGroup: enable },
        });
        assert.equal((await change(false)).statusCode, 200);
        assert.deepEqual((await requestHealth(id, 'GET')).json(), { available: false, consentVersion: 'esc-blood-group-v1' });
        assert.equal((await change(true)).statusCode, 200);
        assert.equal((await requestHealth(id, 'GET')).json().bloodGroup, undefined);
        assert.equal((await requestHealth(id, 'PUT', candidateHeaders, valid)).statusCode, 200);
        const reject = await api.inject({
          method: 'PATCH', url: `/api/applications/${id}/decision`, headers: adminAuth, remoteAddress: from,
          payload: { status: 'rejected', reason: 'QA rejection' },
        });
        assert.equal(reject.statusCode, 200, reject.body);
        assert.equal((await requestHealth(id, 'GET', adminAuth)).json().bloodGroup, undefined);
        const healthRows = await db!.query('SELECT * FROM application_blood_groups WHERE application_id = $1', [id]);
        assert.equal(healthRows.rowCount, 0);
        const audit = await db!.query(
          "SELECT action, metadata FROM audit_logs WHERE entity_id = $1 AND action LIKE 'esc_blood_group_%'",
          [id],
        );
        assert.ok(audit.rows.some(item => item.action === 'esc_blood_group_consent_revoked'));
        assert.equal(JSON.stringify(audit.rows).includes('AB+'), false);
      });
      await t.test(
        'only one concurrent refresh consumes a refresh token',
        async () => {
          const login = await api.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: candidate.email,
              password: 'LocalTestPassword123',
            },
          });
          assert.equal(login.statusCode, 200, login.body);
          const results = await Promise.all(
            [1, 2].map(() =>
              api.inject({
                method: 'POST',
                url: '/api/auth/refresh',
                payload: { refreshToken: login.json().refreshToken },
              }),
            ),
          );
          assert.deepEqual(
            results.map(result => result.statusCode).sort(),
            [200, 401],
          );
        },
      );
      await t.test(
        'rejection does not alter the stage and last super admin cannot request deletion',
        async () => {
          const rejected = await api.inject({
            method: 'PATCH',
            url: `/api/applications/${applicationId}/decision`,
            headers,
            payload: { status: 'rejected', reason: 'Test decision' },
          });
          assert.equal(rejected.statusCode, 200);
          assert.equal(rejected.json().status, 'application_stage');
          assert.equal(
            (
              await api.inject({
                method: 'DELETE',
                url: '/api/users/me',
                headers,
              })
            ).statusCode,
            409,
          );
        },
      );
      await t.test(
        'bounded pagination, safe exports and private PDF responses',
        async () => {
          const page = await api.inject({
            url: '/api/applications?page=1&pageSize=25',
            headers,
          });
          assert.equal(page.statusCode, 200, page.body);
          assert.equal(page.json().total, 1);
          assert.equal(page.json().pageSize, 25);
          assert.equal(
            (
              await api.inject({
                url: '/api/applications?page=1&pageSize=101',
                headers,
              })
            ).statusCode,
            400,
          );
          const xlsx = await api.inject({
            url: '/api/admin/exports/applications.xlsx',
            headers,
          });
          assert.equal(xlsx.statusCode, 200, xlsx.body);
          assert.equal(xlsx.rawPayload.subarray(0, 2).toString(), 'PK');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(xlsx.rawPayload as never);
          const sheet = workbook.worksheets[0];
          assert.ok(sheet);
          assert.equal(sheet.rowCount, 2);
          assert.equal(JSON.stringify(sheet.getRow(1).values).includes('bloodGroup'), false);
          const zip = await api.inject({ url: `/api/admin/exports/documents.zip?applicationIds=${applicationId}`, headers });
          assert.equal(zip.statusCode, 200, zip.body);
          const entries = unzipSync(zip.rawPayload);
          const current = (await db!.query('SELECT id FROM documents WHERE application_id=$1 AND is_current', [applicationId])).rows;
          assert.equal(Object.keys(entries).length, current.length);
          for (const [name, content] of Object.entries(entries)) {
            assert.ok(name.startsWith(`${applicationId}/`));
            assert.ok(current.some(row => name.includes(row.id)));
            assert.equal((await PDFDocument.load(content)).getPageCount(), 2);
          }
          assert.equal((await api.inject({ url: `/api/admin/exports/documents.zip?applicationIds=${applicationId}`, headers: candidateHeaders })).statusCode, 403);
        },
      );
      await t.test(
        'complete application, PDF, mobility and return workflow',
        async () => {
          await api.inject({
            method: 'PATCH',
            url: `/api/applications/${applicationId}/decision`,
            headers,
            payload: { status: 'active' },
          });
          await api.inject({
            method: 'PATCH',
            url: '/api/users/me',
            headers: candidateHeaders,
            payload: { birthDate: '2000-01-01' },
          });
          const cv = {
            profileTitle: 'Volunteer applicant',
            summary:
              'Experienced volunteer working on community projects. '.repeat(2),
            keySkills: 'Communication, teamwork and collaboration.',
            digitalSkills: 'Office',
            workExperiences: [
              {
                role: 'Volunteer',
                organization: 'Association',
                startDate: '2023',
                endDate: '2025',
                responsibilities: 'Community projects',
              },
            ],
            educationEntries: [
              {
                qualification: 'Bachelor',
                institution: 'University',
                startDate: '2020',
                endDate: '2024',
                description: 'Studies',
              },
            ],
            languageSkills: [
              {
                language: 'English',
                listening: 'B2',
                reading: 'B2',
                spokenInteraction: 'B2',
                spokenProduction: 'B2',
                writing: 'B2',
              },
            ],
          };
          const letter = {
            addressee: 'Dear project team',
            subject: 'ESC application',
            openingParagraph: 'word '.repeat(20),
            motivationParagraph: 'word '.repeat(40),
            contributionParagraph: 'word '.repeat(40),
            closingParagraph: 'word '.repeat(20),
          };
          const saved = await api.inject({
            method: 'PATCH',
            url: `/api/applications/${applicationId}/personal-info`,
            headers: candidateHeaders,
            payload: { europassCv: cv, motivationLetter: letter },
          });
          assert.equal(saved.statusCode, 200, saved.body);
          for (const kind of ['cv', 'motivation']) {
            const pdf = await api.inject({
              url: `/api/applications/${applicationId}/pdf/${kind}`,
              headers: candidateHeaders,
            });
            assert.equal(pdf.statusCode, 200, pdf.body);
            assert.equal(pdf.headers['cache-control'], 'private, no-store');
            assert.ok(
              (await PDFDocument.load(pdf.rawPayload)).getPageCount() > 0,
            );
          }
          const submitted = await api.inject({
            method: 'POST',
            url: `/api/applications/${applicationId}/submit`,
            headers: candidateHeaders,
            payload: {},
          });
          assert.equal(submitted.statusCode, 200, submitted.body);
          assert.ok(submitted.json().submittedAt);
          const erasmus = await api.inject({
            method: 'PATCH',
            url: `/api/applications/${applicationId}/stage`,
            headers,
            payload: { stage: 'erasmus_stage' },
          });
          assert.equal(erasmus.statusCode, 200, erasmus.body);
          assert.equal(
            (await upload('test_outbound_key_01', 'boarding_pass_outbound'))
              .statusCode,
            201,
          );
          assert.equal(
            (
              await api.inject({
                method: 'PATCH',
                url: `/api/applications/${applicationId}/stage`,
                headers,
                payload: { stage: 'returned_home' },
              })
            ).statusCode,
            409,
          );
          assert.equal(
            (await upload('test_return_key_001', 'boarding_pass_return'))
              .statusCode,
            201,
          );
          const returned = await api.inject({
            method: 'PATCH',
            url: `/api/applications/${applicationId}/stage`,
            headers,
            payload: { stage: 'returned_home' },
          });
          assert.equal(returned.statusCode, 200, returned.body);
          assert.equal(returned.json().status, 'returned_home');
        },
      );
      await t.test(
        'temporary password changes invalidate old sessions and logout revokes the current session',
        async () => {
          const login = await api.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: temporary.email,
              password: 'LocalTestPassword123',
            },
          });
          assert.equal(login.statusCode, 200, login.body);
          const h = { authorization: `Bearer ${login.json().accessToken}` };
          const change = await api.inject({
            method: 'POST',
            url: '/api/auth/change-password',
            headers: h,
            payload: {
              currentPassword: 'LocalTestPassword123',
              newPassword: 'ChangedLocalPassword123',
            },
          });
          assert.equal(change.statusCode, 200, change.body);
          assert.equal(
            (await api.inject({ url: '/api/auth/me', headers: h })).statusCode,
            401,
          );
          const next = await api.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: temporary.email,
              password: 'ChangedLocalPassword123',
            },
          });
          assert.equal(next.json().user.mustChangePassword, false);
          const active = { authorization: `Bearer ${next.json().accessToken}` };
          assert.equal(
            (
              await api.inject({
                method: 'POST',
                url: '/api/auth/logout',
                headers: active,
                payload: {},
              })
            ).statusCode,
            204,
          );
          assert.equal(
            (await api.inject({ url: '/api/auth/me', headers: active }))
              .statusCode,
            401,
          );
        },
      );
      await t.test(
        'deletion completion reflects actual file cleanup and retries safely',
        async () => {
          const requested = await api.inject({
            method: 'DELETE',
            url: '/api/users/me',
            headers: candidateHeaders,
          });
          assert.equal(requested.statusCode, 202, requested.body);
          const list = (
            await api.inject({ url: '/api/admin/deletion-requests', headers })
          ).json();
          const deletion = list.find(
            (item: { userId: string }) => item.userId === candidate.id,
          );
          assert.ok(deletion);
          const completed = await api.inject({
            method: 'POST',
            url: `/api/admin/deletion-requests/${deletion.id}/complete`,
            headers,
            payload: {},
          });
          assert.equal(completed.statusCode, 200, completed.body);
          assert.equal(completed.json().status, 'completed');
          assert.equal(
            (
              await db!.query(
                'SELECT count(*) FROM documents WHERE application_id=$1',
                [applicationId],
              )
            ).rows[0].count,
            '0',
          );
          assert.equal(
            (
              await db!.query(
                'SELECT status,blood_group FROM users WHERE id=$1',
                [candidate.id],
              )
            ).rows[0].status,
            'anonymized',
          );
          await runCleanupJobs(db!, config.FILE_STORAGE_PATH);
          assert.equal(
            (
              await db!.query(
                'SELECT count(*) FROM file_cleanup_jobs WHERE completed_at IS NULL',
              )
            ).rows[0].count,
            '0',
          );
        },
      );
      await t.test(
        'one thousand applications are paged without message hydration',
        async () => {
          await db!.query(
            `WITH people AS (INSERT INTO users(name,email,role,status) SELECT 'Load '||n,'load-'||n||'@test.invalid','candidate','active' FROM generate_series(1,1000) n RETURNING id)
        INSERT INTO applications(user_id,program_id,personal_info,program_snapshot) SELECT people.id,$1,'{}'::jsonb,a.program_snapshot FROM people CROSS JOIN applications a WHERE a.id=$2`,
            [programId, applicationId],
          );
          const page = await api.inject({
            url: '/api/applications?page=1&pageSize=25',
            headers,
          });
          assert.equal(page.statusCode, 200, page.body);
          assert.equal(page.json().items.length, 25);
          assert.equal(page.json().total, 1001);
          assert.equal(
            page
              .json()
              .items.some(
                (item: Record<string, unknown>) => 'messages' in item,
              ),
            false,
          );
        },
      );
      await t.test(
        'general messages are paged, scoped and counted without loading other conversations',
        async () => {
          const thread = `general:${other.id}`,
            otherHeaders = { authorization: `Bearer ${await token(other)}` };
          const sent = await api.inject({
            method: 'POST',
            url: `/api/messages/${thread}`,
            headers,
            payload: { content: 'Test message' },
          });
          assert.equal(sent.statusCode, 201, sent.body);
          const summary = await api.inject({
            url: '/api/messages/summary?page=1&pageSize=25',
            headers: otherHeaders,
          });
          assert.equal(summary.statusCode, 200, summary.body);
          assert.equal(summary.json().items[0].unread, 1);
          assert.equal(summary.json().total, 1);
          const count = await api.inject({
            url: '/api/messages/unread-count',
            headers: otherHeaders,
          });
          assert.equal(count.statusCode, 200, count.body);
          assert.equal(count.json().unread, 1);
          const page = await api.inject({
            url: `/api/messages/${thread}?page=1&pageSize=25`,
            headers: otherHeaders,
          });
          assert.equal(page.statusCode, 200, page.body);
          assert.equal(page.json().total, 1);
          assert.equal(
            (
              await api.inject({
                method: 'POST',
                url: `/api/messages/${thread}/read`,
                headers: otherHeaders,
                payload: {},
              })
            ).statusCode,
            204,
          );
          assert.equal(
            (
              await api.inject({
                url: '/api/messages/unread-count',
                headers: otherHeaders,
              })
            ).json().unread,
            0,
          );
        },
      );
      await t.test(
        'legacy API writes retain automatic snapshots and document versions during rollback',
        async () => {
          const application = (
            await db!.query(
              'INSERT INTO applications(user_id,program_id,personal_info) VALUES($1,$2,$3) RETURNING id,program_snapshot',
              [other.id, programId, {}],
            )
          ).rows[0];
          assert.equal(application.program_snapshot.id, programId);
          const insert = () =>
            db!.query(
              "INSERT INTO documents(application_id,type,file_name,storage_path,mime_type,size_bytes) VALUES($1,'identity','test.pdf','legacy-test.pdf','application/pdf',100) RETURNING version",
              [application.id],
            );
          assert.equal((await insert()).rows[0].version, 1);
          assert.equal((await insert()).rows[0].version, 2);
          const current = await db!.query(
            'SELECT version FROM documents WHERE application_id=$1 AND is_current',
            [application.id],
          );
          assert.deepEqual(current.rows, [{ version: 2 }]);
          await db!.query('DELETE FROM applications WHERE id=$1', [
            application.id,
          ]);
        },
      );
      await t.test(
        'email confirmation is single use and SMTP failure leaves the existing address unchanged',
        async () => {
          const otherHeaders = {
            authorization: `Bearer ${await token(other)}`,
          };
          const unavailable = await api.inject({
            method: 'POST',
            url: '/api/auth/request-email-change',
            headers: otherHeaders,
            payload: {
              email: 'unavailable@test.invalid',
              currentPassword: 'LocalTestPassword123',
            },
          });
          assert.equal(unavailable.statusCode, 503, unavailable.body);
          assert.equal(
            (await db!.query('SELECT email FROM users WHERE id=$1', [other.id]))
              .rows[0].email,
            other.email,
          );
          const opaque = createOpaqueToken();
          await db!.query(
            "INSERT INTO email_change_tokens(user_id,new_email,token_hash,token_version,expires_at) VALUES($1,'confirmed@test.invalid',$2,$3,now()+interval '30 minutes')",
            [other.id, hashToken(opaque), other.token_version],
          );
          const page = await api.inject({
            url: `/confirm-email-change?token=${opaque}`,
          });
          assert.equal(page.statusCode, 200, page.body);
          assert.equal(
            (
              await api.inject({
                method: 'POST',
                url: '/api/auth/confirm-email-change',
                payload: { token: opaque },
              })
            ).statusCode,
            200,
          );
          assert.equal(
            (
              await api.inject({
                method: 'POST',
                url: '/api/auth/confirm-email-change',
                payload: { token: opaque },
              })
            ).statusCode,
            400,
          );
          assert.equal(
            (await api.inject({ url: '/api/auth/me', headers: otherHeaders }))
              .statusCode,
            401,
          );
        },
      );
      await t.test(
        'failed physical file cleanup stays pending and is retried',
        async () => {
          const deletion = (
            await db!.query(
              'SELECT * FROM account_deletion_requests WHERE user_id=$1',
              [candidate.id],
            )
          ).rows[0];
          await writeFile(join(directory, 'not-a-directory'), 'test');
          await writeFile(join(config.FILE_STORAGE_PATH, 'retry.pdf'), 'test');
          await db!.query(
            "UPDATE account_deletion_requests SET status='approved' WHERE id=$1",
            [deletion.id],
          );
          await db!.query(
            "INSERT INTO file_cleanup_jobs(request_id,storage_path) VALUES($1,'retry.pdf')",
            [deletion.id],
          );
          await runCleanupJobs(db!, join(directory, 'not-a-directory'));
          assert.equal(
            (
              await db!.query(
                'SELECT status FROM account_deletion_requests WHERE id=$1',
                [deletion.id],
              )
            ).rows[0].status,
            'approved',
          );
          const job = (
            await db!.query(
              "SELECT * FROM file_cleanup_jobs WHERE request_id=$1 AND storage_path='retry.pdf'",
              [deletion.id],
            )
          ).rows[0];
          assert.equal(job.attempts, 1);
          assert.equal(job.completed_at, null);
          await db!.query(
            'UPDATE file_cleanup_jobs SET next_attempt_at=now() WHERE id=$1',
            [job.id],
          );
          await runCleanupJobs(db!, config.FILE_STORAGE_PATH);
          assert.equal(
            (
              await db!.query(
                'SELECT status FROM account_deletion_requests WHERE id=$1',
                [deletion.id],
              )
            ).rows[0].status,
            'completed',
          );
        },
      );
      await t.test('admin uploads are audited, versioned, and visible only to authorized users', async () => {
        const [staff, outsider] = (await db!.query(
          `INSERT INTO users(name,email,role,status,password_hash,must_change_password) VALUES
          ('Staff upload','staff-upload@test.invalid','admin','active',$1,false),
          ('Other candidate','upload-outsider@test.invalid','candidate','active',$1,false) RETURNING *`,
          [hash],
        )).rows;
        const staffHeaders = { authorization: `Bearer ${await token(staff)}` };
        const owner = (await db!.query('SELECT * FROM users WHERE id=$1', [other.id])).rows[0];
        const ownerHeaders = { authorization: `Bearer ${await token(owner)}` };
        const outsiderHeaders = { authorization: `Bearer ${await token(outsider)}` };
        const program = await api.inject({
          method: 'POST', url: '/api/programs', headers,
          payload: { name: 'Admin document test', year: 2026, checklist: [{ documentType: 'identity', expectedFormat: 'PDF' }] },
        });
        assert.equal(program.statusCode, 201, program.body);
        const assigned = await api.inject({
          method: 'POST', url: '/api/applications', headers: staffHeaders,
          payload: { programId: program.json().id, userId: owner.id },
        });
        assert.equal(assigned.statusCode, 201, assigned.body);
        const base = `/api/applications/${assigned.json().id}`;
        const upload = (type: string, key: string) => api.inject({
          method: 'POST', url: `${base}/documents/${type}`,
          headers: {
            ...staffHeaders, 'content-type': 'multipart/form-data; boundary=ADMINUPLOAD',
            'idempotency-key': key,
          },
          payload: Buffer.concat([
            Buffer.from('--ADMINUPLOAD\r\nContent-Disposition: form-data; name="file"; filename="reference.pdf"\r\nContent-Type: application/pdf\r\n\r\n'),
            bytes, Buffer.from('\r\n--ADMINUPLOAD--\r\n'),
          ]),
        });
        const first = await upload('identity', 'admin-identity-v1');
        assert.equal(first.statusCode, 201, first.body);
        const second = await upload('identity', 'admin-identity-v2');
        assert.equal(second.statusCode, 201, second.body);
        assert.equal(second.json().version, 2);
        assert.equal(second.json().status, 'unread');
        const retry = await upload('identity', 'admin-identity-v2');
        assert.equal(retry.statusCode, 200, retry.body);
        assert.equal(retry.json().id, second.json().id);
        assert.equal((await upload('extra', 'admin-extra-first')).statusCode, 201);
        assert.equal((await upload('extra', 'admin-extra-second')).statusCode, 201);
        const detail = await api.inject({ url: base, headers: ownerHeaders });
        assert.equal(detail.statusCode, 200, detail.body);
        assert.equal(detail.json().documents.filter((doc: { type: string }) => doc.type === 'extra').length, 2);
        const history = await api.inject({ url: `${base}/documents/history`, headers: ownerHeaders });
        assert.equal(history.statusCode, 200, history.body);
        assert.equal(history.json().find((doc: { id: string }) => doc.id === first.json().id).isCurrent, false);
        const fileUrl = second.json().fileUrl;
        const opened = await api.inject({ url: fileUrl, headers: ownerHeaders });
        assert.equal(opened.statusCode, 200, opened.body);
        assert.deepEqual(opened.rawPayload, bytes);
        assert.equal((await api.inject({ url: fileUrl, headers: outsiderHeaders })).statusCode, 404);
        assert.equal((await db!.query(
          "SELECT actor_user_id FROM audit_logs WHERE action='document_uploaded' AND entity_id=$1",
          [second.json().id],
        )).rows[0].actor_user_id, staff.id);
      });
    } finally {
      if (app) await app.close();
      else await db?.end();
      await embedded?.stop();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
