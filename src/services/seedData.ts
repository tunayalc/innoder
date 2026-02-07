import { Application, Document, Message, AuditLog } from '../types';

// Generate unique IDs
let idCounter = Date.now();
const generateId = () => (++idCounter).toString();

/**
 * Creates seed applications to populate the admin view with sample data.
 * Called when admin logs in and no applications exist yet.
 */
export const createSeedApplications = (): Application[] => {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  return [
    {
      id: 'app-001',
      userId: 'user-aylin',
      programId: 'prog-a',
      programName: 'Program A',
      status: 'needs_fix',
      personalInfo: {
        fullName: 'Aylin Demir',
        birthDate: '1995-04-15',
        identityNumber: '12345678901',
        programSelection: 'Program A',
      },
      documents: [
        {
          id: 'doc-001',
          applicationId: 'app-001',
          type: 'identity',
          fileName: 'kimlik_aylin.jpg',
          status: 'missing',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-002',
          applicationId: 'app-001',
          type: 'form',
          fileName: 'basvuru_formu.pdf',
          status: 'ok',
          uploadedAt: yesterday,
          verifiedAt: now,
        },
        {
          id: 'doc-003',
          applicationId: 'app-001',
          type: 'extra',
          fileName: 'ek_belge.jpg',
          status: 'unread',
          uploadedAt: yesterday,
        },
      ],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      submittedAt: yesterday,
    },
    {
      id: 'app-002',
      userId: 'user-kerem',
      programId: 'prog-b',
      programName: 'Program B',
      status: 'under_review',
      personalInfo: {
        fullName: 'Kerem Kaya',
        birthDate: '1998-08-22',
        identityNumber: '98765432109',
        programSelection: 'Program B',
      },
      documents: [
        {
          id: 'doc-004',
          applicationId: 'app-002',
          type: 'identity',
          fileName: 'kimlik_kerem.jpg',
          status: 'ok',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-005',
          applicationId: 'app-002',
          type: 'form',
          fileName: 'basvuru_formu_kerem.pdf',
          status: 'ok',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-006',
          applicationId: 'app-002',
          type: 'extra',
          fileName: 'ek_belge_kerem.jpg',
          status: 'unread',
          uploadedAt: yesterday,
        },
      ],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      submittedAt: yesterday,
    },
    {
      id: 'app-003',
      userId: 'user-selin',
      programId: 'prog-a',
      programName: 'Program A',
      status: 'approved',
      personalInfo: {
        fullName: 'Selin Bora',
        birthDate: '1997-01-10',
        identityNumber: '55566677788',
        programSelection: 'Program A',
      },
      documents: [
        {
          id: 'doc-007',
          applicationId: 'app-003',
          type: 'identity',
          fileName: 'kimlik_selin.jpg',
          status: 'ok',
          uploadedAt: twoDaysAgo,
          verifiedAt: yesterday,
        },
        {
          id: 'doc-008',
          applicationId: 'app-003',
          type: 'form',
          fileName: 'basvuru_formu_selin.pdf',
          status: 'ok',
          uploadedAt: twoDaysAgo,
          verifiedAt: yesterday,
        },
        {
          id: 'doc-009',
          applicationId: 'app-003',
          type: 'extra',
          fileName: 'ek_belge_selin.pdf',
          status: 'ok',
          uploadedAt: twoDaysAgo,
          verifiedAt: yesterday,
        },
      ],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      submittedAt: twoDaysAgo,
    },
  ];
};

/**
 * Creates seed messages for the demo applications.
 */
export const createSeedMessages = (): Message[] => {
  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();

  return [
    {
      id: 'msg-001',
      applicationId: 'app-001',
      senderId: 'admin-1',
      senderRole: 'admin',
      content: 'Kimlik belgesi eksik. Lütfen yeniden yükleyiniz.',
      createdAt: twoHoursAgo,
      readAt: hourAgo,
    },
    {
      id: 'msg-002',
      applicationId: 'app-001',
      senderId: 'user-aylin',
      senderRole: 'candidate',
      content: 'Bugün tekrar göndereceğim.',
      createdAt: hourAgo,
    },
    {
      id: 'msg-003',
      applicationId: 'app-001',
      senderId: 'admin-1',
      senderRole: 'admin',
      content: 'Ek belge bulanık. OKUNMADI olarak işaretlendi.',
      createdAt: now,
    },
  ];
};

/**
 * Creates seed audit logs for demo.
 */
export const createSeedAuditLogs = (): AuditLog[] => {
  const baseTime = Date.now() - 86400000;
  return [
    {
      id: 'audit-001',
      action: 'USER_REGISTERED',
      userId: 'user-aylin',
      targetId: 'user-aylin',
      details: 'Aylin Demir hesap oluşturdu',
      timestamp: new Date(baseTime).toISOString(),
    },
    {
      id: 'audit-002',
      action: 'APPLICATION_SUBMITTED',
      userId: 'user-aylin',
      targetId: 'app-001',
      details: 'Program A başvurusu gönderildi',
      timestamp: new Date(baseTime + 600000).toISOString(),
    },
    {
      id: 'audit-003',
      action: 'DOCUMENT_UPLOADED',
      userId: 'user-aylin',
      targetId: 'doc-002',
      details: 'Başvuru formu yüklendi (basvuru_formu.pdf)',
      timestamp: new Date(baseTime + 900000).toISOString(),
    },
    {
      id: 'audit-004',
      action: 'ADMIN_VERIFIED',
      userId: 'admin-1',
      targetId: 'doc-002',
      details: 'Başvuru formu doğrulandı → OK',
      timestamp: new Date(baseTime + 1800000).toISOString(),
    },
    {
      id: 'audit-005',
      action: 'MESSAGE_SENT',
      userId: 'admin-1',
      targetId: 'app-001',
      details: 'Kimlik belgesi eksik bildirimi gönderildi',
      timestamp: new Date(baseTime + 2400000).toISOString(),
    },
    {
      id: 'audit-006',
      action: 'USER_REGISTERED',
      userId: 'user-kerem',
      targetId: 'user-kerem',
      details: 'Kerem Kaya hesap oluşturdu',
      timestamp: new Date(baseTime + 3000000).toISOString(),
    },
    {
      id: 'audit-007',
      action: 'APPLICATION_SUBMITTED',
      userId: 'user-kerem',
      targetId: 'app-002',
      details: 'Program B başvurusu gönderildi',
      timestamp: new Date(baseTime + 3600000).toISOString(),
    },
    {
      id: 'audit-008',
      action: 'STATUS_CHANGED',
      userId: 'admin-1',
      targetId: 'app-003',
      details: 'Selin Bora başvurusu onaylandı',
      timestamp: new Date(baseTime + 5400000).toISOString(),
    },
  ];
};

/**
 * Helper to create an audit log entry
 */
export const createAuditEntry = (
  action: AuditLog['action'],
  userId: string,
  targetId: string,
  details: string,
): AuditLog => ({
  id: generateId(),
  action,
  userId,
  targetId,
  details,
  timestamp: new Date().toISOString(),
});

/**
 * Helper to create a new application for a candidate
 */
export const createNewApplication = (
  userId: string,
  programName: string,
  personalInfo: Application['personalInfo'],
): Application => {
  const now = new Date().toISOString();
  const appId = generateId();
  return {
    id: appId,
    userId,
    programId: programName.toLowerCase().replace(/\s+/g, '-'),
    programName,
    status: 'draft',
    personalInfo,
    documents: [
      {
        id: generateId(),
        applicationId: appId,
        type: 'identity',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
      {
        id: generateId(),
        applicationId: appId,
        type: 'form',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
      {
        id: generateId(),
        applicationId: appId,
        type: 'extra',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
};
