import { Application, Message, AuditLog, User, createGeneralChatThreadId } from '../types';
import {
  createProgramDraftInput,
  materializeAssignedProgram,
} from './programFactory';

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
  const programA = materializeAssignedProgram({
    id: 'prog-a',
    input: createProgramDraftInput({
      name: 'Program A',
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
    createdAt: twoDaysAgo,
    createdByUserId: 'admin-1',
  });
  const programB = materializeAssignedProgram({
    id: 'prog-b',
    input: createProgramDraftInput({
      name: 'Program B',
      year: 2026,
      documentTypes: ['identity', 'form', 'extra'],
    }),
    createdAt: twoDaysAgo,
    createdByUserId: 'admin-1',
  });

  return [
    {
      id: 'app-001',
      userId: 'user-aylin',
      programId: programA.id,
      programName: programA.name,
      program: programA,
      status: 'application_stage',
      decisionStatus: 'active',
      personalInfo: {
        fullName: 'Aylin Demir',
        birthDate: '1995-04-15',
        identityNumber: '12345678901',
        programSelection: programA.id,
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
          id: 'doc-002b',
          applicationId: 'app-001',
          type: 'visa_payment_receipt_original',
          fileName: '',
          status: 'missing',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-002c',
          applicationId: 'app-001',
          type: 'photo_activity_report',
          fileName: 'faaliyet_raporu_aylin.jpg',
          status: 'unread',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-003',
          applicationId: 'app-001',
          type: 'extra',
          fileName: 'ek_belge.jpg',
          status: 'unread',
          uploadedAt: yesterday,
        },
        {
          id: 'doc-010',
          applicationId: 'app-001',
          type: 'boarding_pass',
          fileName: 'boarding_pass_aylin.jpg',
          status: 'wrong_format',
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
      programId: programB.id,
      programName: programB.name,
      program: programB,
      status: 'application_stage',
      decisionStatus: 'active',
      personalInfo: {
        fullName: 'Kerem Kaya',
        birthDate: '1998-08-22',
        identityNumber: '98765432109',
        programSelection: programB.id,
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
      programId: programA.id,
      programName: programA.name,
      program: programA,
      status: 'erasmus_stage',
      decisionStatus: 'active',
      personalInfo: {
        fullName: 'Selin Bora',
        birthDate: '1997-01-10',
        identityNumber: '55566677788',
        programSelection: programA.id,
        motivationLetter: {
          addressee: 'Inno Derneği Seçim Ekibi',
          subject: 'Program A Başvuru Motivasyon Mektubu',
          openingParagraph: 'Merhaba, ben Selin Bora. İnşaat Mühendisliği son sınıf öğrencisiyim ve gençlik projelerinde aktif olarak yer almaktayım. Program A\'ya başvurmama sebep olan temel motivasyonum, Avrupa\'da sürdürülebilir mimari ve çevre dostu yapı teknolojilerini öğrenmek ve bu alanda kendimi geliştirmek istemem.',
          motivationParagraph: 'Program A\'yı seçmemin başlıca nedenleri arasında çevre mühendisliği ve sürdürülebilir kalkınma alanlarında sunduğu eğitim fırsatları yer alıyor. Özellikle Avrupa Birliği\'nin yeşil dönüşüm politikalarını yerinde öğrenme ve bu konularda projeler geliştirme imkanı beni çok heyecanlandırıyor. Ayrıca kültürlerarası deneyim kazanarak hem kişisel hem de profesyonel anlamda büyümeyi hedefliyorum.',
          contributionParagraph: 'Programa katacağım değerler açısından düşündüğümde; üniversitede çevre kulübünde aktif görev almam, TÜBİTAK projesinde yer almam ve yerel belediye ile sürdürülebilir şehircilik üzerine gönüllü çalışmalarım bulunuyor. Bu deneyimlerim sayesinde proje yönetimi, ekip çalışması ve problem çözme becerilerim gelişti. Programa hem Türkiye perspektifi katacağım hem de diğer katılımcılarla bilgi alışverişinde bulunarak ortak projeler üreteceğim.',
          closingParagraph: 'Programa katılımım konusunda tam bir kararlılık ve sorumluluk bilinci taşıdığımı belirtmek isterim. Belirlenen takvime uyacağımı, tüm aktivitelere aktif katılım sağlayacağımı ve program sonunda edindiğim bilgileri ülkemde yaygınlaştırmak için çalışacağımı taahhüt ediyorum. Bu değerli fırsat için şimdiden teşekkür ederim.'
        },
        europassCv: {
          profileTitle: 'İnşaat Mühendisi & Sürdürülebilir Kalkınma Uzmanı',
          summary: 'İnşaat Mühendisliği son sınıf öğrencisi olarak çevre dostu yapı teknolojileri ve sürdürülebilir şehircilik alanlarında uzmanlaşmaya odaklanıyorum. Aktif gençlik çalışmaları ve proje deneyimlerimle Avrupa gençlik programlarında yer almaya hazırım.',
          keySkills: 'Proje yönetimi, AutoCAD, sürdürülebilir mimari tasarım, çevre mühendisliği, ekip liderliği, araştırma ve analiz, sunum yapma, Avrupa Birliği politikaları, kültürlerarası iletişim',
          digitalSkills: 'AutoCAD, SketchUp, Microsoft Office Suite, Canva, Adobe Photoshop, Google Workspace, Zoom, Teams, LinkedIn',
          workExperiences: [
            {
              role: 'Proje Gönüllüsü',
              organization: 'Ankara Büyükşehir Belediyesi',
              startDate: '2024-06',
              endDate: 'Devam ediyor',
              responsibilities: 'Sürdürülebilir şehircilik projesinde veri toplama, analiz ve raporlama görevlerinde bulundum. Kent planlaması üzerine araştırmalar yaptım.'
            },
            {
              role: 'Stajyer Mühendis',
              organization: 'Yeşil Yapı İnşaat Ltd.',
              startDate: '2024-07',
              endDate: '2024-08',
              responsibilities: 'LEED sertifikası sürecinde yer aldım, çevre dostu malzeme araştırmaları yaptım ve enerji verimliliği analizlerinde görev aldım.'
            }
          ],
          educationEntries: [
            {
              qualification: 'Lisans: İnşaat Mühendisliği',
              institution: 'Orta Doğu Teknik Üniversitesi',
              startDate: '2020-09',
              endDate: '2025-06',
              description: 'GPA: 3.45/4.0. Çevre Mühendisliği yan dalı. TÜBİTAK projesine katılım. Çevre kulübü başkan yardımcısı.'
            },
            {
              qualification: 'Lise Diploması',
              institution: 'Ankara Fen Lisesi',
              startDate: '2016-09',
              endDate: '2020-06',
              description: 'Matematik-Fen bölümü mezunu. Bilim olimpiyatları ve çevre projelerinde aktif katılım.'
            }
          ],
          languageSkills: [
            {
              language: 'İngilizce',
              listening: 'B2',
              reading: 'B2',
              spokenInteraction: 'B2',
              spokenProduction: 'B2',
              writing: 'B2'
            },
            {
              language: 'Almanca',
              listening: 'A2',
              reading: 'A2',
              spokenInteraction: 'A2',
              spokenProduction: 'A1',
              writing: 'A2'
            }
          ]
        }
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
          id: 'doc-008b',
          applicationId: 'app-003',
          type: 'visa_payment_receipt_original',
          fileName: 'vize_dekontu_selin.pdf',
          status: 'ok',
          uploadedAt: twoDaysAgo,
          verifiedAt: yesterday,
        },
        {
          id: 'doc-008c',
          applicationId: 'app-003',
          type: 'photo_activity_report',
          fileName: 'faaliyet_raporu_selin.pdf',
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
        {
          id: 'doc-011',
          applicationId: 'app-003',
          type: 'boarding_pass',
          fileName: 'boarding_pass_selin.pdf',
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
      id: 'msg-general-001',
      applicationId: createGeneralChatThreadId('user-aylin'),
      senderId: 'admin-1',
      senderRole: 'admin',
      content: 'Merhaba Aylin, genel iletişim hattına hoş geldiniz.',
      createdAt: twoHoursAgo,
      readAt: hourAgo,
    },
    {
      id: 'msg-general-002',
      applicationId: createGeneralChatThreadId('user-aylin'),
      senderId: 'user-aylin',
      senderRole: 'candidate',
      content: 'Teşekkürler, genel sorularımı buradan ileteceğim.',
      createdAt: hourAgo,
    },
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

export const createSeedUsers = (): User[] => {
  const now = new Date().toISOString();

  return [
    {
      id: 'user-aylin',
      email: 'aylin@inno.com',
      name: 'Aylin Demir',
      role: 'candidate',
      kvkkAccepted: true,
      credentialRequestPending: true,
      credentialRequestedAt: now,
      status: 'verified',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-kerem',
      email: 'kerem@inno.com',
      name: 'Kerem Kaya',
      role: 'candidate',
      kvkkAccepted: true,
      status: 'verified',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-selin',
      email: 'selin@inno.com',
      name: 'Selin Bora',
      role: 'candidate',
      kvkkAccepted: true,
      credentialSentAt: now,
      status: 'verified',
      createdAt: now,
      updatedAt: now,
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
  const program = materializeAssignedProgram({
    id: programName.toLowerCase().replace(/\s+/g, '-'),
    input: createProgramDraftInput({
      name: programName,
      year: new Date().getFullYear(),
      documentTypes: [
        'identity',
        'form',
        'visa_payment_receipt_original',
        'boarding_pass',
        'photo_activity_report',
        'extra',
      ],
    }),
    createdAt: now,
  });
  return {
    id: appId,
    userId,
    programId: program.id,
    programName: program.name,
    program,
    status: 'application_stage',
    decisionStatus: 'active',
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
      {
        id: generateId(),
        applicationId: appId,
        type: 'visa_payment_receipt_original',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
      {
        id: generateId(),
        applicationId: appId,
        type: 'boarding_pass',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
      {
        id: generateId(),
        applicationId: appId,
        type: 'photo_activity_report',
        fileName: '',
        status: 'missing',
        uploadedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
};
