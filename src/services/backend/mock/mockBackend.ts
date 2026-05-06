import type { InnoBackend } from '../types';
import { BackendError } from '../types';
import type {
  Application,
  AuditLog,
  Document,
  Message,
  PersonalInfo,
  ProgramDraftInput,
  User,
} from '../../../types';
import { appConfig } from '../../../config/appConfig';
import {
  ACTIVE_DOCUMENT_TYPES,
  createProgramDraftInput,
  DEFAULT_REQUIRED_DOCUMENT_TYPES,
  materializeAssignedProgram,
  normalizeDocumentTypes,
} from '../../programFactory';
import {
  createSeedApplications,
  createSeedAuditLogs,
  createSeedMessages,
  createSeedUsers,
} from '../../seedData';
import { MOCK_STORAGE_KEYS, readJson, writeJson } from './mockStorage';
import { isValidEmail } from '../../../utils/validation';
import { createGeneralChatThreadId } from '../../../types';

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const nowISO = () => new Date().toISOString();

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const DEMO_CANDIDATE_EMAIL = 'aday@inno.com';
const DEMO_CANDIDATE_PASSWORD = '123123';

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
  // Force fresh seed data for this version - always reload
  await writeJson(MOCK_STORAGE_KEYS.users, createSeedUsers());
  await writeJson(MOCK_STORAGE_KEYS.applications, createSeedApplications());
  await writeJson(MOCK_STORAGE_KEYS.messages, createSeedMessages());
  await writeJson(MOCK_STORAGE_KEYS.auditLogs, createSeedAuditLogs());
};

const getRequiredDocTypesForProgram = (
  program: Application['program'],
): Document['type'][] =>
  normalizeDocumentTypes(program.checklist.map((item) => item.documentType));

const createDraftApplication = (params: {
  userId: string;
  program: ProgramDraftInput;
  fullName: string;
  createdByUserId: string;
}): Application => {
  const createdAt = nowISO();
  const program = materializeAssignedProgram({
    id: generateId('program'),
    input: params.program,
    createdAt,
    createdByUserId: params.createdByUserId,
  });
  const requiredDocTypes = getRequiredDocTypesForProgram(program);
  const applicationId = generateId('app');

  return {
    id: applicationId,
    userId: params.userId,
    programId: program.id,
    programName: program.name,
    program,
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
    submittedAt: undefined,
  };
};

const ensureProgramOnApplication = (app: Application): Application => {
  if (app.program) {
    const normalizedChecklist = app.program.checklist.filter((item) =>
      ACTIVE_DOCUMENT_TYPES.includes(item.documentType),
    );
    const normalizedDocuments = app.documents.filter((document) =>
      normalizeDocumentTypes(app.program.checklist.map((item) => item.documentType)).includes(
        document.type,
      ),
    );

    if (
      normalizedChecklist.length === app.program.checklist.length &&
      normalizedDocuments.length === app.documents.length
    ) {
      return app;
    }

    return {
      ...app,
      program: {
        ...app.program,
        checklist: normalizedChecklist,
      },
      documents: normalizedDocuments,
    };
  }

  const documentTypes = Array.from(new Set(app.documents.map((doc) => doc.type)));
  const input = createProgramDraftInput({
    name: app.programName || 'Program',
    year: new Date(app.createdAt).getFullYear() || new Date().getFullYear(),
    documentTypes:
      documentTypes.length > 0 ? documentTypes : DEFAULT_REQUIRED_DOCUMENT_TYPES,
  });
  const programId = app.programId || generateId('program');
  const program = materializeAssignedProgram({
    id: programId,
    input,
    createdAt: app.createdAt,
  });

  return {
    ...app,
    programId,
    programName: program.name,
    program,
    personalInfo: {
      ...app.personalInfo,
      programSelection: app.personalInfo.programSelection || programId,
    },
  };
};

const addMissingRequiredDocuments = (app: Application): Application => {
  const normalizedApp = ensureProgramOnApplication(app);
  const requiredDocTypes = getRequiredDocTypesForProgram(normalizedApp.program);
  const existingTypes = new Set(app.documents.map((d) => d.type));
  const missingTypes = requiredDocTypes.filter((type) => !existingTypes.has(type));

  if (missingTypes.length === 0) return normalizedApp;

  const ts = nowISO();
  return {
    ...normalizedApp,
    documents: [
      ...normalizedApp.documents,
      ...missingTypes.map((type) => ({
        id: generateId('doc'),
        applicationId: normalizedApp.id,
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
    const users = await listUsers();
    const passwords = await readPasswords();
    const existing = users.find(
      (u) => u.email.toLowerCase() === DEMO_CANDIDATE_EMAIL && u.role === 'candidate',
    );

    if (existing) {
      if (!passwords[existing.id]) {
        passwords[existing.id] = DEMO_CANDIDATE_PASSWORD;
        await writePasswords(passwords);
      }
      return;
    }

    const ts = nowISO();
    const demoUser: User = {
      id: 'candidate-demo-001',
      email: DEMO_CANDIDATE_EMAIL,
      name: 'Demo Aday',
      phone: '+905551112233',
      country: 'Türkiye',
      city: 'İstanbul',
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

    passwords[demoUser.id] = DEMO_CANDIDATE_PASSWORD;
    await writePasswords(passwords);
  };

  const ensureDemoCandidateProgramSeed = async (user: User): Promise<void> => {
    if (
      user.role !== 'candidate' ||
      user.email.toLowerCase() !== DEMO_CANDIDATE_EMAIL
    ) {
      return;
    }

    const apps = await listApplications();
    const hasAnyProgram = apps.some((a) => a.userId === user.id);
    if (hasAnyProgram) return;

    const ts = nowISO();
    const demoApp = createDraftApplication({
      userId: user.id,
      program: createProgramDraftInput({
        name: 'Program C',
        year: 2026,
        documentTypes: [
          'identity',
          'form',
          'visa_payment_receipt_original',
          'boarding_pass',
          'photo_activity_report',
          'extra',
        ],
      }),
      fullName: user.name,
      createdByUserId: 'admin-001',
    });

    demoApp.status = 'under_review';
    demoApp.submittedAt = ts;
    demoApp.updatedAt = ts;
    demoApp.personalInfo = {
      ...demoApp.personalInfo,
      birthDate: '2000-01-15',
      identityNumber: '10000000146',
      motivationLetter: {
        addressee: 'Inno Association Selection Team',
        subject: 'Program C Motivation',
        openingParagraph:
          'I am applying as a motivated youth participant with prior volunteer experience.',
        motivationParagraph:
          'Program C aligns with my learning goals in intercultural communication and youth mobility.',
        contributionParagraph:
          'I can contribute with teamwork, event support and content production experience.',
        closingParagraph:
          'Thank you for your review. I am available for further steps and interviews.',
      },
    };

    demoApp.documents = demoApp.documents.map((doc) => {
      switch (doc.type) {
        case 'identity':
          return {
            ...doc,
            fileName: 'demo_kimlik.jpg',
            status: 'ok',
            uploadedAt: ts,
            pageCount: 1,
          };
        case 'form':
          return {
            ...doc,
            fileName: 'demo_form.jpg',
            status: 'wrong_format',
            uploadedAt: ts,
            pageCount: 1,
          };
        case 'boarding_pass':
          return {
            ...doc,
            fileName: 'demo_boarding_pass.jpg',
            status: 'ok',
            parseResult: 'QR_OK:DEMO12345',
            uploadedAt: ts,
            pageCount: 1,
          };
        case 'visa_payment_receipt_original':
          return {
            ...doc,
            fileName: '',
            status: 'missing',
            uploadedAt: ts,
            pageCount: 1,
          };
        case 'photo_activity_report':
          return {
            ...doc,
            fileName: 'demo_faaliyet_raporu.jpg',
            status: 'unread',
            uploadedAt: ts,
            pageCount: 1,
          };
        case 'extra':
          return {
            ...doc,
            fileName: 'demo_ek_belge.pdf',
            status: 'ok',
            uploadedAt: ts,
            pageCount: 1,
          };
        default:
          return doc;
      }
    });

    apps.push(demoApp);
    await writeApplications(apps);

    const messages = await listMessages();
    const hasThread = messages.some((m) => m.applicationId === demoApp.id);
    if (!hasThread) {
      messages.push(
        {
          id: generateId('msg'),
          applicationId: createGeneralChatThreadId(user.id),
          senderId: 'admin-001',
          senderRole: 'admin',
          content: 'Merhaba, genel iletişim hattından bize ulaşabilirsiniz.',
          createdAt: ts,
        },
        {
          id: generateId('msg'),
          applicationId: demoApp.id,
          senderId: 'admin-001',
          senderRole: 'admin',
          content:
            'Hoş geldiniz. Program C örnek içeriği demo amaçlı olarak atanmıştır.',
          createdAt: ts,
        },
        {
          id: generateId('msg'),
          applicationId: demoApp.id,
          senderId: user.id,
          senderRole: 'candidate',
          content: 'Tesekkurler, ornek program icerigini goruyorum.',
          createdAt: ts,
        },
      );
      await writeMessages(messages);
    }

    await appendAudit(
      createAudit(
        'APPLICATION_SUBMITTED',
        user.id,
        demoApp.id,
        'Demo aday icin ornek Program C basvurusu seed edildi',
      ),
    );
  };

  return {
    auth: {
      loginCandidate: (params) =>
        withMockDelay(async () => {
          await ensureCandidateAuthSeed();
          const users = await listUsers();
          const user = users.find(
            (u) =>
              u.role === 'candidate' &&
              u.email.toLowerCase() === params.email.toLowerCase().trim(),
          );
          if (!user) {
            throw new BackendError('UNAUTHORIZED', 'Kullanıcı bulunamadı.');
          }

          const passwords = await readPasswords();
          if (!passwords[user.id]) {
            throw new BackendError(
              'UNAUTHORIZED',
              'Bu hesap icin giris bilgileri henuz tanimlanmadi. Sadece tarafimizca paylasilan bilgilerle giris yapabilirsiniz.',
            );
          }
          if (passwords[user.id] !== params.password) {
            throw new BackendError('UNAUTHORIZED', 'Sifre yanlis.');
          }
          await ensureDemoCandidateProgramSeed(user);
          return user;
        }),

      registerCandidate: (params) =>
        withMockDelay(async () => {
          if (!params.fullName.trim()) {
            throw new BackendError('VALIDATION', 'Ad soyad zorunludur.');
          }

          const email = params.email.toLowerCase().trim();
          if (!email || !isValidEmail(email)) {
            throw new BackendError('VALIDATION', 'Gecerli bir e-posta giriniz.');
          }
          if (!params.kvkkAccepted) {
            throw new BackendError(
              'VALIDATION',
              'KVKK aydinlatma ve acik riza onayi zorunludur.',
            );
          }

          const users = await listUsers();
          const emailExists = users.some((u) => u.email.toLowerCase() === email);
          if (emailExists) {
            throw new BackendError('VALIDATION', 'Bu e-posta zaten kayitli.');
          }

          const userId = generateId('user');
          const now = nowISO();
          const newUser: User = {
            id: userId,
            email,
            name: params.fullName.trim(),
            eventLink: params.eventLink?.trim() || undefined,
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

          await appendAudit(
            createAudit(
              'USER_REGISTERED',
              userId,
              userId,
              `${newUser.name} kayit oldu (${newUser.email})`,
            ),
          );

          return newUser;
        }),
      requestCandidatePassword: ({ fullName, email }) =>
        withMockDelay(async () => {
          await seedIfEmpty();

          const normalizedEmail = email.toLowerCase().trim();
          const users = await listUsers();
          const idx = users.findIndex(
            (u) => u.role === 'candidate' && u.email.toLowerCase() === normalizedEmail,
          );

          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Bu e-posta ile kayıtlı aday bulunamadı.');
          }

          const now = nowISO();
          const updatedUser: User = {
            ...users[idx],
            name: fullName.trim() || users[idx].name,
            credentialRequestPending: true,
            credentialRequestedAt: now,
            updatedAt: now,
          };

          users[idx] = updatedUser;
          await writeUsers(users);

          const messages = await listMessages();
          messages.push({
            id: generateId('msg'),
            applicationId: createGeneralChatThreadId(updatedUser.id),
            senderId: updatedUser.id,
            senderRole: 'candidate',
            content: 'Merhaba, doğrulama ve giriş için şifre talep ediyorum.',
            createdAt: now,
          });
          await writeMessages(messages);

          await appendAudit(
            createAudit(
              'MESSAGE_SENT',
              updatedUser.id,
              createGeneralChatThreadId(updatedUser.id),
              `${updatedUser.name} şifre talebi gönderdi`,
            ),
          );

          return updatedUser;
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
      listCandidates: () =>
        withMockDelay(async () => {
          const users = await listUsers();
          return users
            .filter((u) => u.role === 'candidate')
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        }),
      sendCandidatePassword: ({ candidateUserId, password, adminUserId }) =>
        withMockDelay(async () => {
          await seedIfEmpty();

          if (!password.trim()) {
            throw new BackendError('VALIDATION', 'Gönderilecek şifre zorunludur.');
          }

          const users = await listUsers();
          const idx = users.findIndex(
            (u) => u.role === 'candidate' && u.id === candidateUserId,
          );

          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Aday kullanıcı bulunamadı.');
          }

          const passwords = await readPasswords();
          passwords[candidateUserId] = password.trim();
          await writePasswords(passwords);

          const now = nowISO();
          const updatedUser: User = {
            ...users[idx],
            credentialRequestPending: false,
            credentialSentAt: now,
            updatedAt: now,
          };

          users[idx] = updatedUser;
          await writeUsers(users);

          const messages = await listMessages();
          messages.push({
            id: generateId('msg'),
            applicationId: createGeneralChatThreadId(updatedUser.id),
            senderId: adminUserId,
            senderRole: 'admin',
            content: 'Giriş ve doğrulama şifreniz e-posta adresinize gönderildi.',
            createdAt: now,
          });
          await writeMessages(messages);

          await appendAudit(
            createAudit(
              'STATUS_CHANGED',
              adminUserId,
              updatedUser.id,
              `${updatedUser.name} için giriş şifresi oluşturuldu ve gönderildi`,
            ),
          );

          return updatedUser;
        }),
    },

    programs: {
      listPrograms: () =>
        withMockDelay(async () => {
          const apps = await listApplications();
          return apps.map((app) => app.program);
        }),
      getProgram: (programId: string) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const program = apps.find((app) => app.program.id === programId)?.program;
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

          if (filters.status) {
            apps = apps.filter((a) => a.status === filters.status);
          }
          if (filters.programId) {
            apps = apps.filter((a) => a.programId === filters.programId);
          }
          if (filters.hasIssues !== undefined) {
            apps = apps.filter((a) => {
              const issues = a.documents.some((d) => d.status !== 'ok');
              return filters.hasIssues ? issues : !issues;
            });
          }
          if (filters.createdAfterISO) {
            const ts = new Date(filters.createdAfterISO).getTime();
            apps = apps.filter((a) => new Date(a.createdAt).getTime() >= ts);
          }
          if (filters.query) {
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
      listForCandidate: ({ userId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const myApps = apps.filter((a) => a.userId === userId);
          return sortByCreatedAtDesc(myApps);
        }),

      ensureDraft: ({ userId, program, fullName }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const existing = apps.find((a) => a.userId === userId);
          if (existing) return existing;

          const draft = createDraftApplication({
            userId,
            program,
            fullName,
            createdByUserId: userId,
          });
          apps.push(draft);
          await writeApplications(apps);
          return draft;
        }),
      assignProgram: ({ userId, program, fullName }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const existing = apps.find(
            (a) =>
              a.userId === userId &&
              a.program.name.trim().toLowerCase() === program.name.trim().toLowerCase() &&
              a.program.year === program.year,
          );
          if (existing) return existing;

          const assigned = createDraftApplication({
            userId,
            program: {
              ...program,
              checklist: createProgramDraftInput({
                name: program.name,
                year: program.year,
                documentTypes: normalizeDocumentTypes(
                  (program.checklist || []).map((item) => item.documentType),
                ),
                steps: program.steps,
                deadlines: program.deadlines,
                commonMistakes: program.commonMistakes,
              }).checklist,
            },
            fullName,
            createdByUserId: 'admin-001',
          });
          apps.push(assigned);
          await writeApplications(apps);

          await appendAudit(
            createAudit(
              'STATUS_CHANGED',
              'admin-001',
              assigned.id,
              `${assigned.programName} adayi icin program atandi`,
            ),
          );
          return assigned;
        }),

      updatePersonalInfo: ({ applicationId, patch, programId }) =>
        withMockDelay(async () => {
          const apps = await listApplications();
          const idx = apps.findIndex((a) => a.id === applicationId);
          if (idx === -1) {
            throw new BackendError('NOT_FOUND', 'Başvuru bulunamadı.');
          }

          const current = apps[idx];
          const updated: Application = {
            ...current,
            personalInfo: {
              ...current.personalInfo,
              ...(patch as Partial<PersonalInfo>),
              programSelection: programId || current.programId,
            },
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

          const expected = app.program.checklist.find(
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
              `${updatedDoc.type} yüklendi (${params.fileName}) -> ${status.toUpperCase()}`,
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
            verifyNote: params.note.trim() || undefined,
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
              `Belge doğrulandı -> ${params.status.toUpperCase()}${params.note ? ` (${params.note})` : ''}`,
            ),
          );

          if (nextStatus !== app.status) {
            await appendAudit(
              createAudit(
                'STATUS_CHANGED',
                params.verifiedByUserId,
                app.id,
                `Başvuru durumu güncellendi -> ${nextStatus.toUpperCase()}`,
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


