import type { InnoBackend } from '../types';
import { BackendError } from '../types';
import type { Application, AuditLog, Document, Message, PersonalInfo, User } from '../../../types';
import { appConfig } from '../../../config/appConfig';
import { PROGRAM_CATALOG, getProgramById } from '../../programCatalog';
import { createSeedApplications, createSeedAuditLogs, createSeedMessages } from '../../seedData';
import { MOCK_STORAGE_KEYS, readJson, writeJson } from './mockStorage';
import { isValidEmail, isValidPhoneNumber } from '../../../utils/validation';

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const nowISO = () => new Date().toISOString();

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createAudit = (
  action: AuditLog['action'],
  userId: string,
  targetId: string,
  details: string,
): AuditLog => ({
  id: generateId('audit'),
  action,
  userId,
  targetId,
  details,
  timestamp: nowISO(),
});

const seedIfEmpty = async (): Promise<void> => {
  const applications = await readJson<Application[]>(
    MOCK_STORAGE_KEYS.applications,
    [],
  );
  if (applications.length > 0) return;

  await writeJson(MOCK_STORAGE_KEYS.applications, createSeedApplications());
  await writeJson(MOCK_STORAGE_KEYS.messages, createSeedMessages());
  await writeJson(MOCK_STORAGE_KEYS.auditLogs, createSeedAuditLogs());
};

const getRequiredDocTypesForProgram = (programId: string): Document['type'][] => {
  const program = getProgramById(programId);
  // Keep order as defined in checklist.
  return program.checklist.map((x) => x.documentType);
};

const createDraftApplication = (params: {
  userId: string;
  programId: string;
  fullName: string;
}): Application => {
  const createdAt = nowISO();
  const program = getProgramById(params.programId);
  const requiredDocTypes = getRequiredDocTypesForProgram(params.programId);
  const applicationId = generateId('app');

  return {
    id: applicationId,
    userId: params.userId,
    programId: program.id,
    programName: program.name,
    status: 'draft',
    personalInfo: {
      fullName: params.fullName,
      programSelection: program.id,
    },
    documents: requiredDocTypes.map((type) => ({
      id: generateId('doc'),
      applicationId,
      type,
      fileName: '',
      status: 'missing',
      uploadedAt: createdAt,
      pageCount: 0,
    })),
    createdAt,
    updatedAt: createdAt,
  };
};

const addMissingRequiredDocuments = (app: Application): Application => {
  const requiredDocTypes = getRequiredDocTypesForProgram(app.programId);
  const existingTypes = new Set(app.documents.map((d) => d.type));
  const missingTypes = requiredDocTypes.filter((type) => !existingTypes.has(type));

  if (missingTypes.length === 0) return app;

  const ts = nowISO();
  return {
    ...app,
    documents: [
      ...app.documents,
      ...missingTypes.map((type) => ({
        id: generateId('doc'),
        applicationId: app.id,
        type,
        fileName: '',
        status: 'missing' as const,
        uploadedAt: ts,
        pageCount: 0,
      })),
    ],
    updatedAt: ts,
  };
};

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]): T[] =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const createMockBackend = (): InnoBackend => {
  const withMockDelay = async <T>(fn: () => Promise<T>): Promise<T> => {
    await delay(appConfig.mock.delayMs);
    return fn();
  };

  const listAudit = async (): Promise<AuditLog[]> =>
    readJson<AuditLog[]>(MOCK_STORAGE_KEYS.auditLogs, []);

  const appendAudit = async (log: AuditLog): Promise<void> => {
    const logs = await listAudit();
    logs.unshift(log);
    await writeJson(MOCK_STORAGE_KEYS.auditLogs, logs);
  };

  const listApplications = async (): Promise<Application[]> => {
    const apps = await readJson<Application[]>(MOCK_STORAGE_KEYS.applications, []);
    const normalized = apps.map(addMissingRequiredDocuments);
    const changed = normalized.some((app, idx) => app !== apps[idx]);

    if (changed) {
      await writeJson(MOCK_STORAGE_KEYS.applications, normalized);
    }

    return normalized;
  };

  const writeApplications = async (apps: Application[]) =>
    writeJson(MOCK_STORAGE_KEYS.applications, apps);

  const listMessages = async (): Promise<Message[]> =>
    readJson<Message[]>(MOCK_STORAGE_KEYS.messages, []);

  const writeMessages = async (msgs: Message[]) =>
    writeJson(MOCK_STORAGE_KEYS.messages, msgs);

  const listUsers = async (): Promise<User[]> =>
    readJson<User[]>(MOCK_STORAGE_KEYS.users, []);

  const writeUsers = async (users: User[]) =>
    writeJson(MOCK_STORAGE_KEYS.users, users);

  const readPasswords = async (): Promise<Record<string, string>> =>
    readJson<Record<string, string>>(MOCK_STORAGE_KEYS.passwords, {});

  const writePasswords = async (pw: Record<string, string>) =>
    writeJson(MOCK_STORAGE_KEYS.passwords, pw);

  const ensureCandidateAuthSeed = async (): Promise<void> => {
    const demoEmail = 'aday@inno.com';
    const demoPassword = '123123';

    const users = await listUsers();
    const passwords = await readPasswords();
    const existing = users.find(
      (u) => u.email.toLowerCase() === demoEmail && u.role === 'candidate',
    );

    if (existing) {
      if (!passwords[existing.id]) {
        passwords[existing.id] = demoPassword;
        await writePasswords(passwords);
      }
      return;
    }

    const ts = nowISO();
    const demoUser: User = {
      id: 'candidate-demo-001',
      email: demoEmail,
      name: 'Demo Aday',
      phone: '+905551112233',
      country: 'Turkiye',
      city: 'Istanbul',
      role: 'candidate',
      kvkkAccepted: true,
      consentVersion: 'v1',
      consentedAt: ts,
      status: 'verified',
      createdAt: ts,
      updatedAt: ts,
    };

    users.push(demoUser);
    await writeUsers(users);

    passwords[demoUser.id] = demoPassword;
    await writePasswords(passwords);
  };

  return {
    auth: {
      loginCandidate: (params) =>
        withMockDelay(async () => {
          await ensureCandidateAuthSeed();
          const users = await listUsers();
          const user = users.find(
            (u) => u.email.toLowerCase() === params.email.toLowerCase().trim(),
          );
          if (!user) {
            throw new BackendError('UNAUTHORIZED', 'Kullanıcı bulunamadı.');
          }
          const passwords = await readPasswords();
          if (passwords[user.id] !== params.password) {
            throw new BackendError('UNAUTHORIZED', 'Şifre yanlış.');
          }
          return user;
        }),

      registerCandidate: (params) =>
        withMockDelay(async () => {
          if (!params.fullName.trim()) {
            throw new BackendError('VALIDATION', 'Ad soyad zorunludur.');
          }
          const email = params.email.toLowerCase().trim();
          if (!email || !isValidEmail(email)) {
            throw new BackendError('VALIDATION', 'Geçerli bir e-posta giriniz.');
          }
          if (!params.kvkkAccepted) {
            throw new BackendError(
              'VALIDATION',
              'KVKK aydınlatma ve açık rıza onayı zorunludur.',
            );
          }
          if (params.phone && !isValidPhoneNumber(params.phone)) {
            throw new BackendError(
              'VALIDATION',
              'Geçerli bir telefon numarası giriniz.',
            );
          }
          if (params.password.trim().length < 6) {
            throw new BackendError('VALIDATION', 'Şifre en az 6 karakter olmalı.');
          }

          const users = await listUsers();
          const emailExists = users.some(
            (u) => u.email.toLowerCase() === email,
          );
          if (emailExists) {
            throw new BackendError('VALIDATION', 'Bu e-posta zaten kayıtlı.');
          }

          const userId = generateId('user');
          const now = nowISO();
          const newUser: User = {
            id: userId,
            email,
            name: params.fullName.trim(),
            phone: params.phone?.trim() || undefined,
            country: params.country?.trim() || undefined,
            city: params.city?.trim() || undefined,
            role: 'candidate',
            kvkkAccepted: true,
            consentVersion: 'v1',
            consentedAt: now,
            status: 'verified',
            createdAt: now,
            updatedAt: now,
          };

          users.push(newUser);
          await writeUsers(users);

          const passwords = await readPasswords();
          passwords[userId] = params.password;
          await writePasswords(passwords);

          await appendAudit(
            createAudit(
              'USER_REGISTERED',
              userId,
              userId,
              `${newUser.name} kullanıcı kaydı oluşturdu`,
            ),
          );

          return newUser;
        }),

      loginAdmin: (params) =>
        withMockDelay(async () => {
          const ADMIN_USERNAME = 'admin';
          const ADMIN_PASSWORD = '123123';

          if (
            params.username.trim() !== ADMIN_USERNAME ||
            params.password !== ADMIN_PASSWORD
          ) {
            throw new BackendError('UNAUTHORIZED', 'Kullanıcı adı veya şifre yanlış.');
          }

          await seedIfEmpty();

          const now = nowISO();
          const adminUser: User = {
            id: 'admin-001',
            email: 'admin@inno.com',
            name: 'Admin',
            role: 'admin',
            kvkkAccepted: true,
            status: 'verified',
            createdAt: now,
            updatedAt: now,
          };
          return adminUser;
        }),

      logout: () => withMockDelay(async () => {}),

      updateProfile: ({ userId, patch }) =>
        withMockDelay(async () => {
          const users = await listUsers();
          const idx = users.findIndex((u) => u.id === userId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Kullanıcı bulunamadı.');
          }

          const updated: User = {
            ...users[idx],
            ...patch,
            updatedAt: nowISO(),
          };
          users[idx] = updated;
          await writeUsers(users);
          return updated;
        }),
    },

    programs: {
      listPrograms: () => withMockDelay(async () => PROGRAM_CATALOG),
      getProgram: (programId: string) =>
        withMockDelay(async () => {
          const program = PROGRAM_CATALOG.find((p) => p.id === programId);
          if (!program) {
            throw new BackendError('NOT_FOUND', 'Program bulunamadı.');
          }
          return program;
        }),
    },

    applications: {
      listForAdmin: (filters) =>
        withMockDelay(async () => {
          await seedIfEmpty();
          let apps = await listApplications();

          if (filters?.status) {
            apps = apps.filter((a) => a.status === filters.status);
          }
          if (filters?.programId) {
            apps = apps.filter((a) => a.programId === filters.programId);
          }
          if (filters?.hasIssues !== undefined) {
            apps = apps.filter((a) => {
              const issues = a.documents.some((d) => d.status !== 'ok');
              return filters.hasIssues ? issues : !issues;
            });
          }
          if (filters?.createdAfterISO) {
            const ts = new Date(filters.createdAfterISO).getTime();
            apps = apps.filter((a) => new Date(a.createdAt).getTime() >= ts);
          }
          if (filters?.query) {
            const q = filters.query.trim().toLowerCase();
            if (q) {
              apps = apps.filter((a) => {
                const name = a.personalInfo.fullName.toLowerCase();
                return (
                  name.includes(q) ||
                  a.id.toLowerCase().includes(q) ||
                  a.programName.toLowerCase().includes(q)
                );
              });
            }
          }

          return sortByCreatedAtDesc(apps);
        }),

      getForCandidate: ({ userId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const myApps = apps.filter((a) => a.userId === userId);
          if (myApps.length === 0) return null;
          return sortByCreatedAtDesc(myApps)[0];
        }),

      ensureDraft: ({ userId, programId, fullName }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const existing = apps.find((a) => a.userId === userId);
          if (existing) return existing;

          const draft = createDraftApplication({ userId, programId, fullName });
          apps.push(draft);
          await writeApplications(apps);
          return draft;
        }),

      updatePersonalInfo: ({ applicationId, patch, programId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === applicationId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');
          }

          const current = apps[idx];
          const nextProgramId = programId ?? current.programId;
          const program = getProgramById(nextProgramId);

          // If program changes, make sure documents list matches required types.
          const requiredDocTypes = getRequiredDocTypesForProgram(nextProgramId);
          const docs: Document[] = requiredDocTypes.map((t) => {
            const existingDoc = current.documents.find((d) => d.type === t);
            return (
              existingDoc || {
                id: generateId('doc'),
                applicationId,
                type: t,
                fileName: '',
                status: 'missing',
                uploadedAt: nowISO(),
                pageCount: 0,
              }
            );
          });

          const updated: Application = {
            ...current,
            programId: program.id,
            programName: program.name,
            personalInfo: {
              ...current.personalInfo,
              ...(patch as Partial<PersonalInfo>),
              programSelection: program.id,
            },
            documents: docs,
            updatedAt: nowISO(),
          };
          apps[idx] = updated;
          await writeApplications(apps);
          return updated;
        }),

      submit: ({ applicationId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === applicationId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');
          }

          const current = apps[idx];
          const ts = nowISO();
          const updated: Application = {
            ...current,
            status: 'submitted',
            updatedAt: ts,
            submittedAt: ts,
          };
          apps[idx] = updated;
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'APPLICATION_SUBMITTED',
              current.userId,
              current.id,
              `${current.personalInfo.fullName} başvuruyu gönderdi (${current.programName})`,
            ),
          );

          return updated;
        }),

      uploadDocument: (params) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === params.applicationId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');
          }

          const app = apps[idx];
          const docIdx = app.documents.findIndex((d) => d.type === params.documentType);
          if (docIdx === -1) {
            throw new BackendError('NOT_FOUND', 'Belge tipi bu program için tanımlı değil.');
          }

          const expected = getProgramById(app.programId).checklist.find(
            (x) => x.documentType === params.documentType,
          );

          const ts = nowISO();

          // Basic format check (mock): if expected mentions PDF, require .pdf
          const fileLower = params.fileName.toLowerCase();
          const expectsPdf = expected?.expectedFormat.toLowerCase().includes('pdf');
          const isPdf = fileLower.endsWith('.pdf') || params.mimeType === 'application/pdf';

          let status: Document['status'] = 'ok';
          if (expectsPdf && !isPdf) {
            status = 'wrong_format';
          } else if (params.qualityScore !== undefined && params.qualityScore < 2) {
            status = 'unread';
          }

          const updatedDoc: Document = {
            ...app.documents[docIdx],
            fileName: params.fileName,
            fileUrl: params.fileUrl || `local://${params.fileName}`,
            pageCount: params.pageCount ?? 1,
            mimeType: params.mimeType,
            status,
            parseResult: params.parseResult,
            uploadedAt: ts,
            verifiedAt: undefined, // server parse happened; admin verification is separate
          };

          const nextDocs = [...app.documents];
          nextDocs[docIdx] = updatedDoc;
          const nextApp: Application = {
            ...app,
            documents: nextDocs,
            updatedAt: ts,
            // If admin requested fix, a successful re-upload should move it back to review.
            status:
              app.status === 'needs_fix' ? 'under_review' : app.status,
          };
          apps[idx] = nextApp;
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'DOCUMENT_UPLOADED',
              app.userId,
              updatedDoc.id,
              `${updatedDoc.type} yüklendi (${params.fileName}) → ${status.toUpperCase()}`,
            ),
          );

          return { application: nextApp, document: updatedDoc };
        }),

      verifyDocument: (params) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === params.applicationId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');
          }

          const app = apps[idx];
          const docIdx = app.documents.findIndex((d) => d.id === params.documentId);
          if (docIdx === -1) {
            throw new BackendError('NOT_FOUND', 'Belge bulunamadı.');
          }

          const ts = nowISO();
          const updatedDoc: Document = {
            ...app.documents[docIdx],
            status: params.status,
            verifiedAt: ts,
            verifiedByUserId: params.verifiedByUserId,
            verifyNote: params.note?.trim() || undefined,
          };

          const nextDocs = [...app.documents];
          nextDocs[docIdx] = updatedDoc;

          const allOk = nextDocs.every((d) => d.status === 'ok');
          const anyIssue = nextDocs.some((d) => d.status !== 'ok');

          let nextStatus: Application['status'] = app.status;
          if (allOk) nextStatus = 'approved';
          else if (anyIssue && params.status !== 'ok') nextStatus = 'needs_fix';
          else if (app.status === 'submitted') nextStatus = 'under_review';
          else if (app.status === 'draft') nextStatus = 'under_review';

          const nextApp: Application = {
            ...app,
            documents: nextDocs,
            status: nextStatus,
            updatedAt: ts,
          };
          apps[idx] = nextApp;
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'ADMIN_VERIFIED',
              params.verifiedByUserId,
              params.documentId,
              `Belge doğrulandı → ${params.status.toUpperCase()}${params.note ? ` (${params.note})` : ''}`,
            ),
          );

          if (nextStatus !== app.status) {
            await appendAudit(
              createAudit(
                'STATUS_CHANGED',
                params.verifiedByUserId,
                app.id,
                `Başvuru durumu güncellendi → ${nextStatus.toUpperCase()}`,
              ),
            );
          }

          return { application: nextApp, document: updatedDoc };
        }),

      approve: ({ applicationId, adminUserId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === applicationId);
          if (idx === -1) throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');

          const ts = nowISO();
          const updated: Application = { ...apps[idx], status: 'approved', updatedAt: ts };
          apps[idx] = updated;
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'STATUS_CHANGED',
              adminUserId,
              applicationId,
              'Başvuru ONAYLANDI',
            ),
          );
          return updated;
        }),

      reject: ({ applicationId, adminUserId, reason }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === applicationId);
          if (idx === -1) throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');

          const ts = nowISO();
          const updated: Application = { ...apps[idx], status: 'rejected', updatedAt: ts };
          apps[idx] = updated;
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'STATUS_CHANGED',
              adminUserId,
              applicationId,
              `Başvuru REDDEDİLDİ: ${reason}`,
            ),
          );
          return updated;
        }),
    },

    messages: {
      listByApplicationId: ({ applicationId }) =>
        withMockDelay(async () => {
          const msgs = await listMessages();
          return msgs
            .filter((m) => m.applicationId === applicationId)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
        }),

      send: (params) =>
        withMockDelay(async () => {
          const ts = nowISO();
          const msg: Message = {
            id: generateId('msg'),
            applicationId: params.applicationId,
            senderId: params.senderId,
            senderRole: params.senderRole,
            content: params.content.trim(),
            createdAt: ts,
            relatedDocumentId: params.relatedDocumentId,
          };

          const msgs = await listMessages();
          msgs.push(msg);
          await writeMessages(msgs);

          await appendAudit(
            createAudit(
              'MESSAGE_SENT',
              params.senderId,
              params.applicationId,
              `Mesaj gönderildi${params.relatedDocumentId ? ` (doc:${params.relatedDocumentId})` : ''}`,
            ),
          );

          return msg;
        }),

      markThreadRead: ({ applicationId, readerId }) =>
        withMockDelay(async () => {
          const msgs = await listMessages();
          let changed = false;
          const ts = nowISO();
          for (const m of msgs) {
            if (m.applicationId !== applicationId) continue;
            if (m.senderId === readerId) continue;
            if (m.readAt) continue;
            m.readAt = ts;
            changed = true;
          }
          if (changed) {
            await writeMessages(msgs);
          }
        }),
    },

    audit: {
      list: () => withMockDelay(listAudit),
      append: (log) => withMockDelay(() => appendAudit(log)),
    },
  };
};
