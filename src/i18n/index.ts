import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectLanguage } from '../store/selectors';
import { setLanguage } from '../store/slices/uiSlice';

export type AppLanguage = 'tr' | 'en';

type TranslationValue = string | readonly TranslationObject[];
type TranslationObject = {
  readonly [key: string]: TranslationValue | TranslationObject;
};
type TranslationNode = TranslationValue | TranslationObject;

const DEFAULT_LANGUAGE: AppLanguage = 'tr';

const isValidLanguage = (value: unknown): value is AppLanguage =>
  value === 'tr' || value === 'en';

const normalizeLanguage = (value: unknown): AppLanguage =>
  isValidLanguage(value) ? value : DEFAULT_LANGUAGE;

const isTranslationRecord = (
  value: TranslationNode | undefined,
): value is Record<string, TranslationNode> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const translations = {
  tr: {
    common: {
      appName: 'Inno Derneği',
      back: 'Geri',
      email: 'E-posta',
      password: 'Şifre',
      loading: 'Yükleniyor...',
      errorTitle: 'Hata',
      refresh: 'Yenile',
      all: 'Tümü',
      cancel: 'İptal',
      save: 'Kaydet',
      logout: 'Çıkış Yap',
      logoutTitle: 'Çıkış Yap',
      logoutMessage: 'Çıkış yapmak istediğinizden emin misiniz?',
      language: 'Dil',
      turkish: 'Türkçe',
      english: 'English',
      auditLog: 'Denetim Kaydı',
      darkTheme: 'Koyu Tema',
      lightTheme: 'Açık Tema',
      settings: 'Ayarlar',
    },
    settings: {
      title: 'Ayarlar',
      subtitle: 'Tema, dil ve iletişim seçeneklerini buradan yönetin.',
      themeTitle: 'Tema',
      themeText: 'Açık ve koyu görünüm arasında geçiş yapın.',
      languageTitle: 'Dil',
      languageText: 'Uygulama metinlerini Türkçe veya İngilizce kullanın.',
      privacyTitle: 'Gizlilik ve Hesap',
      privacyText: 'Aydınlatma metni, destek, şifre ve hesap silme işlemleri.',
      privacyLink: 'Gizlilik Politikasını Aç',
      deletionLink: 'Web Hesap Silme Bilgisi',
      supportLink: 'Destek ve İletişim',
      changePassword: 'Şifremi Değiştir',
      deleteAccount: 'Hesap Silme Talebi',
      deletionWarning: 'Profiliniz ve belgeleriniz için silme/anonimleştirme incelemesi başlatılacaktır. Talebiniz kaydedildiğinde oturumunuz kapatılır.',
      deletionSubmit: 'Talep Oluştur',
      deletionReceived: 'Talebiniz Alındı',
      deletionError: 'Talep oluşturulamadı. Lütfen tekrar deneyin.',
      linkError: 'Bağlantı açılamadı. Cihazınızdaki tarayıcı veya e-posta uygulamasını kontrol edin.',
    },
    nav: {
      applicationList: 'Başvuru Listesi',
      applicationDetail: 'Başvuru Detayı',
      verificationDecision: 'Doğrulama Kararı',
      auditLog: 'Denetim Kaydı',
      documentViewer: 'Belge Görüntüleme',
      messaging: 'Mesajlaşma',
      dataModel: 'Veri Modeli',
      candidateScreens: 'Aday Ekranları',
      registrationForm: 'Kayıt Formu',
      myPrograms: 'Programlarım',
      programDetail: 'Program Detayı',
      personalInfo: 'Kişisel Bilgiler',
      europassCv: 'Europass CV',
      motivationLetter: 'Motivasyon Mektubu',
      documentScan: 'Belge Tarama',
    },
    status: {
      application: {
        application_stage: 'Başvuru Aşaması',
        erasmus_stage: 'Hareketlilik / Erasmus Aşaması',
        returned_home: 'Ülkeye Dönüş Tamamlandı',
      },
    },
    entry: {
      title: 'Inno Derneği',
      subtitle: 'ESC ve Erasmus başvurularınızı takip edin.',
      actionsTitle: 'Hızlı Erişim',
      registerHint: 'Kayıt ekranından hesabınız için başvuru gönderebilirsiniz.',
    },
    auth: {
      loginTitle: 'Giriş Yap',
      loginSubtitle: 'Devam etmek için e-posta veya kullanıcı adınızla giriş yapın.',
      loginButton: 'Giriş Yap',
      loginButtonLoading: 'Giriş yapılıyor...',
      demoButton: 'Demo Giriş (Bilgi Girmeden)',
      demoButtonLoading: 'Demo girişi yapılıyor...',
      loginRoleHint: 'Adaylar e-posta, yöneticiler kullanıcı adı ile giriş yapar.',
      loginAllowedOnly:
        'Sadece tarafımızca giriş bilgisi tanımlanan hesaplar giriş yapabilir.',
      noAccount: 'Hesabınız yok mu?',
      registerNow: 'Kayıt Ol',
      adminLoginLink: 'Yönetici girişi',
      adminDemoButton: 'Yönetici Demo Girişi',
      fillEmailPassword: 'Lütfen e-posta ve şifrenizi girin.',
      fillIdentifierPassword: 'Lütfen e-posta veya kullanıcı adınızı ve şifrenizi girin.',
      identifier: 'E-posta / Kullanıcı Adı',
      identifierPlaceholder: 'ornek@email.com veya admin',
      emailPlaceholder: 'ornek@email.com',
      passwordPlaceholder: 'Şifrenizi girin',
      registerTitle: 'Kayıt Ol',
      registerSubtitle:
        'Kayıt olabilirsiniz. Uygulamaya sadece tarafımızca paylaşılan giriş bilgileri ile giriş yapılabilir.',
      fullName: 'Ad Soyad *',
      fullNamePlaceholder: 'Adınız Soyadınız',
      emailRequired: 'E-posta *',
      eventLinkLabel: 'Katılmak İstediğiniz Etkinlik Linki *',
      eventLinkPlaceholder: 'Lütfen etkinlik linkini paylaşın',
      fillNameEmail: 'Lütfen ad soyad ve e-posta alanlarını doldurun.',
      eventLinkRequired:
        'Hangi etkinliğe katılmak istediğinizi gösteren linki paylaşın.',
      validEmail: 'Geçerli bir e-posta giriniz.',
      kvkkRequired: 'KVKK onayı zorunludur.',
      registerLoading: 'Kayıt yapılıyor...',
      registerSuccessTitle: 'Kayıt alındı',
      registerSuccessText:
        'Başvurunuz alındı. Tarafımızca paylaşılan giriş bilgileriyle daha sonra uygulamaya giriş yapabilirsiniz.',
      ok: 'Tamam',
      backToLogin: 'Giriş ekranına dön',
      noticeTitle: 'KVKK Aydınlatma Metni',
      noticeRead: 'Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum.',
      noticeOpen: 'Aydınlatma Metnini Aç',
      kvkkTitle: 'KVKK Açık Rıza Onayı',
      kvkkText:
        'Kişisel verilerimin başvuru sürecinin yönetimi, iletişim ve doğrulama amacıyla işlenmesini kabul ediyorum.',
      adminTitle: 'Yönetici Girişi',
      adminSubtitle: 'Yönetim paneline erişmek için giriş yapın',
      username: 'Kullanıcı Adı',
      usernamePlaceholder: 'Kullanıcı adınız',
      fillUsernamePassword: 'Lütfen kullanıcı adı ve şifrenizi girin.',
      rememberMe: 'Beni Hatırla',
      contactTitle: 'Bizimle İletişime Geçin',
      contactSubtitle:
        'Şifre almak ve doğrulama sürecini başlatmak için bizimle iletişime geçin.',
      contactMailSubject: 'Inno Derneği İletişim Talebi',
      contactEmailButton: 'E-posta Gönder',
      contactInstagramButton: 'Instagram Aç',
      contactOpenError: 'İletişim bağlantısı açılamadı.',
      passwordRequestButton: 'Şifre Almak İçin Bilgilerimi Yükle',
      passwordRequestSuccessTitle: 'Talep Gönderildi',
      passwordRequestSuccessText:
        'Kaydınız ve şifre talebiniz alındı. Inno Derneği onayından sonra giriş şifreniz e-posta ile gönderilecektir.',
      registerPasswordInfo:
        'Şifre almak için Inno Derneği ile iletişime geçmelisiniz. Doğrulama ve giriş için şifre yönetici onayından sonra gönderilir.',
    },
    candidateMenu: {
      greeting: 'Merhaba, {{name}}',
      fallbackName: 'Aday',
      profileSummary: 'Profil Özeti',
      cvReady: 'CV Hazır',
      cvMissing: 'CV Eksik',
      programAssignments: 'Program Ataması:',
      latestProgram: 'Son Program:',
      status: 'Durum:',
      documentProgress: 'Belge İlerlemesi:',
      waitingForAssignment: 'Admin program ataması bekleniyor.',
      mainBlock: 'ANA BLOK',
      personalInfo: 'Kişisel Bilgiler',
      personalInfoSubtitle: 'TC Kimlik, pasaport ve profil bilgileri',
      myPrograms: 'Programlarım',
      myProgramsSubtitle: 'Admin tarafından atanan programlar',
      messages: 'Mesajlar',
      messagesSubtitle: 'Genel destek ve iletişim alanı',
      europassCv: 'Europass CV',
      europassCvReady: 'CV formatı tamamlandı',
      europassCvMissing: 'CV profilinizi tamamlayın',
    },
    candidateMessages: {
      title: 'Mesajlar',
      generalTitle: 'Genel Mesajlar',
      threadNotFound: 'Konuşma bulunamadı.',
      noThread: 'Henüz açılmış bir konuşma yok.',
      emptyGeneral: 'Henüz genel mesaj yok. İletişim ve destek için buradan yazabilirsiniz.',
      emptyProgram: 'Henüz program mesajı yok. Gerekirse buradan admin ile iletişime geçebilirsiniz.',
      loading: 'Mesajlar yükleniyor...',
      placeholderGeneral: 'Genel mesajınızı yazın...',
      placeholderProgram: 'Program mesajınızı yazın...',
      send: 'Gönder',
      you: 'Siz',
      admin: 'Admin',
      candidate: 'Aday',
    },
    candidatePrograms: {
      title: 'Programlarım',
      subtitle: 'Admin tarafından atanmış tüm programlarınızı bu alandan yönetebilirsiniz.',
      refreshing: 'Yükleniyor...',
      refresh: 'Programları Yenile',
      empty: 'Henüz size atanmış bir program yok. Lütfen admin atamasını bekleyin.',
      documentProgress: 'Belge İlerlemesi',
      cardHint: 'Program detayına girerek motivasyon, belge ve checklist adımlarını yönetin.',
      detailButton: 'Program Detayı',
      messageButton: 'Program Mesajı',
    },
    candidateProgramDetail: {
      notFound: 'Program detayı bulunamadı.',
      headerSubtitle: '{{year}} Program Detayı',
      documentProgress: 'Belge İlerlemesi',
      contentsTitle: 'Program İçerikleri',
      motivationLetter: 'Motivasyon Mektubu',
      complete: 'Tamam',
      missing: 'Eksik',
      goToMotivation: 'Motivasyon Mektubuna Git',
      uploadDocument: 'Belge Yükle',
      programChat: 'Program Sohbeti',
      commitmentTitle: 'Belge Teslim Taahhüdü',
      commitmentTextBase:
        'Activity Agreement ve Taahhütname sisteme taranmış olarak yüklenir; ıslak imzalı asılları ayrıca elden teslim edilir.',
      commitmentTextBoarding:
        ' Gidiş ve dönüş biniş kartları ayrı ayrı yüklenir; asılları hareketlilik dönüşünde Inno Derneği\'ne elden teslim edilir.',
      stepsTitle: 'KATILIM ADIMLARI',
      deadlinesTitle: 'TESLİM TARİHLERİ',
      requiredDocumentsTitle: 'GEREKLİ BELGELER',
    },
    adminList: {
      title: 'Başvuru Listesi',
      count: '{{filtered}}/{{total}} başvuru',
      assignmentTitle: 'Program Atama (Atanmamış Adaylar)',
      assignmentHint:
        'Kayıt olan ancak henüz programa atanmamış adaylar burada görünür.',
      candidateListLoading: 'Aday listesi yükleniyor...',
      noPendingCandidates: 'Atama bekleyen aday yok.',
      assignButton: 'Seçili Adaya Program Ata',
      assignLoading: 'İşleniyor...',
      searchPlaceholder: 'Ara: isim, program, başvuru id',
      allDocumentsDone: 'Tüm belgeler tamam',
      missingDocuments: '{{count}} belge eksik/hatalı',
      noApplicationsForFilter: 'Bu filtreye uygun başvuru yok.',
      loadingOrErrorFallback: 'Yükleniyor...',
      filters: {
        all: 'Tümü',
        submitted: 'Gönderildi',
        underReview: 'İnceleniyor',
        needsFix: 'Düzeltme',
        approved: 'Onaylı',
        dateAll: 'Tarih: Tümü',
        date7d: 'Son 7 gün',
        date30d: 'Son 30 gün',
        docsAll: 'Belge: Tümü',
        docsIssues: 'Eksik/Hatalı Var',
        docsComplete: 'Tamam',
      },
      confirmAssignTitle: 'Program Atama',
      confirmAssignText: '{{candidate}} için {{program}} ataması yapılsın mı?',
      assignConfirm: 'Ata',
    },
    adminVerification: {
      title: 'Doğrulama Kararı',
      warningTitle: 'Uyarı',
      requiredSelection: 'Lütfen belge ve durum seçiniz.',
      savedTitle: 'Kaydedildi',
      savedText: 'Doğrulama kararı başarıyla kaydedildi.',
      ok: 'Tamam',
      applicationNotFound: 'Başvuru bulunamadı.',
      selectDocument: 'Belge Seçin',
      filePrefix: 'Dosya:',
      fileMissing: 'Belge henüz yüklenmemiş',
      selectStatus: 'Yeni Durum Belirleyin',
      notesLabel: 'Açıklama / Not',
      notesPlaceholder: 'Adaya iletilecek açıklama...',
      autoSendMessage: 'Adaya otomatik mesaj gönder',
      saveButton: 'Durumu Kaydet',
      saving: 'Kaydediliyor...',
      statusOk: 'OK',
      statusMissing: 'EKSİK',
      statusWrongFormat: 'YANLIŞ FORMAT',
      statusUnread: 'OKUNMADI',
      quickOk: 'Belgeniz onaylandı.',
      quickMissing: 'Belge eksik. Lütfen gerekli belgeyi yükleyin.',
      quickWrongFormat: 'Yüklenen dosya beklenen formatta değil. Lütfen doğru formatta yükleyin.',
      quickUnread: 'Yüklenen görüntü bulanık/okunamıyor. Lütfen daha net bir görüntü çekin.',
    },
    labels: {
      documentStatus: {
        ok: 'OK',
        missing: 'EKSİK',
        wrong_format: 'YANLIŞ FORMAT',
        unread: 'OKUNMADI',
      },
      documentType: {
        identity: 'Kimlik Belgesi',
        form: 'Başvuru Formu',
        agreement: 'Anlaşma Belgesi',
        photo_activity_report: 'Fotoğraflı Faaliyet Raporu',
        visa_payment_receipt_original: 'Vize Ödeme Dekontu (Asıl)',
        boarding_pass: 'Biniş Kartı',
        boarding_pass_outbound: 'Gidiş Biniş Kartı',
        boarding_pass_return: 'Dönüş Biniş Kartı',
        activity_agreement: 'Activity Agreement',
        commitment_letter: 'Taahhütname',
        extra: 'Ek Belge',
      },
      auditAction: {
        USER_REGISTERED: 'Kullanıcı Kaydı',
        DOCUMENT_UPLOADED: 'Belge Yükleme',
        APPLICATION_SUBMITTED: 'Başvuru Gönderme',
        ADMIN_VERIFIED: 'Admin Doğrulaması',
        MESSAGE_SENT: 'Mesaj Gönderme',
        STATUS_CHANGED: 'Durum Değişikliği',
      },
    },
    home: {
      title: 'Tek kaynaklı başvuru akışı',
      subtitle:
        'Bu prototip, aday ve admin akışlarını tıklanabilir bir şekilde gösteren basit bir mobil arayüzdür. Sadece görsel sunum amaçlıdır.',
      quickAccess: 'Hızlı Giriş',
      candidateScreens: 'Aday Ekranları',
      adminScreens: 'Admin Ekranları',
      dataModel: 'Veri Modeli',
      summary: 'Özet Akış',
      step1: '1) Kayıt ve iletişim doğrulama',
      step2: '2) Program bilgilendirme + kontrol listesi',
      step3: '3) Kişisel bilgi formu',
      step4: '4) Belge tarama / yükleme',
      step5: '5) Admin doğrulama + mesaj',
    },
    dataModel: {
      title: 'Veri Modeli',
      subtitle: 'Her ekranın ürettiği bilgi veritabanında karşılık bulur.',
      users: 'kimlik, iletişim, doğrulama, KVKK',
      applications: 'program, form verisi, başvuru durumu',
      documents: 'belge tipi, dosya, parse sonucu, durum',
      messages: 'başvuruya bağlı mesajlaşma',
      audit: 'REGISTER / SUBMIT / UPLOAD / VERIFY',
    },
    adminMenu: {
      title: 'Admin ekranları',
      subtitle: 'Liste, doğrulama ve audit akışıyla.',
      applicationList: 'Başvuru Listesi',
      applicationDetail: 'Başvuru Detayı',
      verificationDecision: 'Doğrulama Kararı',
      auditLog: 'Denetim Kaydı',
    },
    adminAudit: {
      title: 'Denetim Kaydı',
      count: '{{count}} kayıt',
      empty: 'Henüz denetim kaydı yok.',
      userTarget: 'Kullanıcı: {{userId}} · Hedef: {{targetId}}',
    },
    documentViewer: {
      title: 'Belge Görüntüleme',
      notFound: 'Belge bulunamadı.',
      noFile: 'Henüz dosya yok',
      previewTitle: 'Önizleme (Örnek)',
      previewHint:
        'Backend bağlantısı olmadığı için gerçek dosya görüntüleme yerine sayfa bazlı bir önizleme yer tutucusu gösterilir. Gerçek entegrasyonda dosya URL\'si ile PDF/IMG görüntüleyici açılacak.',
      page: 'Sayfa {{index}}',
      parseTitle: 'Parse Sonucu',
      verifyDecision: 'Doğrulama Kararı',
      messaging: 'Mesajlaşma',
      download: 'Belgeyi indir',
      share: 'Dosyayı paylaş',
      saved: 'Belge İndirilenler / Inno klasörüne kaydedildi.',
      exportError: 'Dosya aktarılamadı. Tekrar deneyin.',
    },
    adminListExtra: {
      refreshShort: 'Yenile',
      loadingShort: '...',
    },
  },
  en: {
    common: {
      appName: 'Inno Association',
      back: 'Back',
      email: 'Email',
      password: 'Password',
      loading: 'Loading...',
      errorTitle: 'Error',
      refresh: 'Refresh',
      all: 'All',
      cancel: 'Cancel',
      save: 'Save',
      logout: 'Log out',
      logoutTitle: 'Log out',
      logoutMessage: 'Are you sure you want to log out?',
      language: 'Language',
      turkish: 'Turkish',
      english: 'English',
      auditLog: 'Audit Log',
      darkTheme: 'Dark Theme',
      lightTheme: 'Light Theme',
      settings: 'Settings',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage theme, language, and contact options from here.',
      themeTitle: 'Theme',
      themeText: 'Switch between light and dark appearance.',
      languageTitle: 'Language',
      languageText: 'Use the app in Turkish or English.',
      privacyTitle: 'Privacy and Account',
      privacyText: 'Privacy notice, support, password and account deletion.',
      privacyLink: 'Open Privacy Policy',
      deletionLink: 'Account Deletion on the Web',
      supportLink: 'Support and Contact',
      changePassword: 'Change Password',
      deleteAccount: 'Request Account Deletion',
      deletionWarning: 'A deletion/anonymization review will begin for your profile and documents. You will be signed out once your request is saved.',
      deletionSubmit: 'Submit Request',
      deletionReceived: 'Request Received',
      deletionError: 'Your request could not be submitted. Please try again.',
      linkError: 'The link could not be opened. Check your browser or email app.',
    },
    nav: {
      applicationList: 'Application List',
      applicationDetail: 'Application Detail',
      verificationDecision: 'Verification Decision',
      auditLog: 'Audit Log',
      documentViewer: 'Document Viewer',
      messaging: 'Messaging',
      dataModel: 'Data Model',
      candidateScreens: 'Candidate Screens',
      registrationForm: 'Registration Form',
      myPrograms: 'My Programs',
      programDetail: 'Program Detail',
      personalInfo: 'Personal Information',
      europassCv: 'Europass CV',
      motivationLetter: 'Motivation Letter',
      documentScan: 'Document Scan',
    },
    status: {
      application: {
        application_stage: 'Application Stage',
        erasmus_stage: 'Mobility / Erasmus Stage',
        returned_home: 'Return Home Completed',
      },
    },
    entry: {
      title: 'Inno Association',
      subtitle: 'Track your ESC and Erasmus applications.',
      actionsTitle: 'Quick Access',
      registerHint: 'Send an account request from the registration screen.',
    },
    auth: {
      loginTitle: 'Log In',
      loginSubtitle: 'Log in with your email or username to continue.',
      loginButton: 'Log In',
      loginButtonLoading: 'Logging in...',
      demoButton: 'Demo Login',
      demoButtonLoading: 'Logging into demo...',
      loginRoleHint: 'Candidates sign in with email, admins sign in with username.',
      loginAllowedOnly:
        'Only accounts provisioned by us can access the application.',
      noAccount: "Don't have an account?",
      registerNow: 'Register',
      adminLoginLink: 'Admin login',
      adminDemoButton: 'Admin Demo Login',
      fillEmailPassword: 'Please enter your email and password.',
      fillIdentifierPassword: 'Please enter your email or username and password.',
      identifier: 'Email / Username',
      identifierPlaceholder: 'example@email.com or admin',
      emailPlaceholder: 'example@email.com',
      passwordPlaceholder: 'Enter your password',
      registerTitle: 'Register',
      registerSubtitle:
        'You may register here. Access is only available with credentials shared by us.',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'Your full name',
      emailRequired: 'Email *',
      eventLinkLabel: 'Event Link You Want to Join *',
      eventLinkPlaceholder: 'Please share the event link',
      fillNameEmail: 'Please fill in the full name and email fields.',
      eventLinkRequired: 'Please share the link for the event you want to join.',
      validEmail: 'Please enter a valid email address.',
      kvkkRequired: 'Privacy consent is required.',
      registerLoading: 'Registering...',
      registerSuccessTitle: 'Registration received',
      registerSuccessText:
        'Your application has been received. You can log into the app later with the credentials shared by us.',
      ok: 'OK',
      backToLogin: 'Back to login',
      noticeTitle: 'Data Protection Notice',
      noticeRead: 'I have read the notice about how my personal data is processed.',
      noticeOpen: 'Open the Data Protection Notice',
      kvkkTitle: 'Privacy Consent',
      kvkkText:
        'I consent to the processing of my personal data for application management, communication, and verification purposes.',
      adminTitle: 'Admin Login',
      adminSubtitle: 'Log in to access the management panel',
      username: 'Username',
      usernamePlaceholder: 'Your username',
      fillUsernamePassword: 'Please enter your username and password.',
      rememberMe: 'Remember Me',
      contactTitle: 'Contact Us',
      contactSubtitle:
        'Contact us to receive your password and start the verification process.',
      contactMailSubject: 'Inno Association Contact Request',
      contactEmailButton: 'Send Email',
      contactInstagramButton: 'Open Instagram',
      contactOpenError: 'The contact link could not be opened.',
      passwordRequestButton: 'Upload My Information to Request a Password',
      passwordRequestSuccessTitle: 'Request Sent',
      passwordRequestSuccessText:
        'Your registration and password request have been received. Your login password will be sent by email after Inno Association approval.',
      registerPasswordInfo:
        'You must contact Inno Association to receive a password. The password for verification and login is sent after admin approval.',
    },
    candidateMenu: {
      greeting: 'Hello, {{name}}',
      fallbackName: 'Candidate',
      profileSummary: 'Profile Summary',
      cvReady: 'CV Ready',
      cvMissing: 'CV Missing',
      programAssignments: 'Program Assignments:',
      latestProgram: 'Latest Program:',
      status: 'Status:',
      documentProgress: 'Document Progress:',
      waitingForAssignment: 'Waiting for admin program assignment.',
      mainBlock: 'MAIN BLOCK',
      personalInfo: 'Personal Information',
      personalInfoSubtitle: 'ID number, passport, and profile information',
      myPrograms: 'My Programs',
      myProgramsSubtitle: 'Programs assigned by the admin',
      messages: 'Messages',
      messagesSubtitle: 'General support and messaging area',
      europassCv: 'Europass CV',
      europassCvReady: 'CV format completed',
      europassCvMissing: 'Complete your CV profile',
    },
    candidateMessages: {
      title: 'Messages',
      generalTitle: 'General Messages',
      threadNotFound: 'Conversation not found.',
      noThread: 'There is no open conversation yet.',
      emptyGeneral: 'There are no general messages yet. You can write here for contact and support.',
      emptyProgram: 'There are no program messages yet. You can contact the admin here if needed.',
      loading: 'Loading messages...',
      placeholderGeneral: 'Write your general message...',
      placeholderProgram: 'Write your program message...',
      send: 'Send',
      you: 'You',
      admin: 'Admin',
      candidate: 'Candidate',
    },
    candidatePrograms: {
      title: 'My Programs',
      subtitle: 'You can manage all programs assigned by the admin from this area.',
      refreshing: 'Loading...',
      refresh: 'Refresh Programs',
      empty: 'There is no program assigned to you yet. Please wait for admin assignment.',
      documentProgress: 'Document Progress',
      cardHint: 'Open the program detail to manage motivation, document, and checklist steps.',
      detailButton: 'Program Detail',
      messageButton: 'Program Message',
    },
    candidateProgramDetail: {
      notFound: 'Program detail could not be found.',
      headerSubtitle: '{{year}} Program Detail',
      documentProgress: 'Document Progress',
      contentsTitle: 'Program Contents',
      motivationLetter: 'Motivation Letter',
      complete: 'Complete',
      missing: 'Missing',
      goToMotivation: 'Go to Motivation Letter',
      uploadDocument: 'Upload Document',
      programChat: 'Program Chat',
      commitmentTitle: 'Document Delivery Commitment',
      commitmentTextBase:
        'Scanned copies of the Activity Agreement and Commitment Letter are uploaded; wet-signed originals are delivered in person.',
      commitmentTextBoarding:
        ' Outbound and return boarding passes are uploaded separately; originals are delivered to Inno Association after the mobility.',
      stepsTitle: 'PARTICIPATION STEPS',
      deadlinesTitle: 'DEADLINES',
      requiredDocumentsTitle: 'REQUIRED DOCUMENTS',
    },
    adminList: {
      title: 'Application List',
      count: '{{filtered}}/{{total}} applications',
      assignmentTitle: 'Program Assignment (Unassigned Candidates)',
      assignmentHint:
        'Candidates who registered but have not yet been assigned to a program appear here.',
      candidateListLoading: 'Loading candidate list...',
      noPendingCandidates: 'No candidates waiting for assignment.',
      assignButton: 'Assign Program to Selected Candidate',
      assignLoading: 'Processing...',
      searchPlaceholder: 'Search: name, program, application id',
      allDocumentsDone: 'All documents complete',
      missingDocuments: '{{count}} documents missing/invalid',
      noApplicationsForFilter: 'No applications match this filter.',
      loadingOrErrorFallback: 'Loading...',
      filters: {
        all: 'All',
        submitted: 'Submitted',
        underReview: 'Under Review',
        needsFix: 'Needs Fix',
        approved: 'Approved',
        dateAll: 'Date: All',
        date7d: 'Last 7 days',
        date30d: 'Last 30 days',
        docsAll: 'Docs: All',
        docsIssues: 'Has Missing/Invalid',
        docsComplete: 'Complete',
      },
      confirmAssignTitle: 'Program Assignment',
      confirmAssignText: 'Assign {{program}} to {{candidate}}?',
      assignConfirm: 'Assign',
    },
    adminVerification: {
      title: 'Verification Decision',
      warningTitle: 'Warning',
      requiredSelection: 'Please select a document and status.',
      savedTitle: 'Saved',
      savedText: 'The verification decision has been saved successfully.',
      ok: 'OK',
      applicationNotFound: 'Application could not be found.',
      selectDocument: 'Select Document',
      filePrefix: 'File:',
      fileMissing: 'The document has not been uploaded yet',
      selectStatus: 'Select New Status',
      notesLabel: 'Explanation / Notes',
      notesPlaceholder: 'Explanation to be sent to the candidate...',
      autoSendMessage: 'Send automatic message to candidate',
      saveButton: 'Save Status',
      saving: 'Saving...',
      statusOk: 'OK',
      statusMissing: 'MISSING',
      statusWrongFormat: 'WRONG FORMAT',
      statusUnread: 'UNREAD',
      quickOk: 'Your document has been approved.',
      quickMissing: 'The document is missing. Please upload the required document.',
      quickWrongFormat: 'The uploaded file is not in the expected format. Please upload the correct format.',
      quickUnread: 'The uploaded image is blurry/unreadable. Please take a clearer image.',
    },
    labels: {
      documentStatus: {
        ok: 'OK',
        missing: 'MISSING',
        wrong_format: 'WRONG FORMAT',
        unread: 'UNREAD',
      },
      documentType: {
        identity: 'Identity Document',
        form: 'Application Form',
        agreement: 'Agreement Document',
        photo_activity_report: 'Photo Activity Report',
        visa_payment_receipt_original: 'Visa Payment Receipt (Original)',
        boarding_pass: 'Boarding Pass',
        boarding_pass_outbound: 'Outbound Boarding Pass',
        boarding_pass_return: 'Return Boarding Pass',
        activity_agreement: 'Activity Agreement',
        commitment_letter: 'Commitment Letter',
        extra: 'Extra Document',
      },
      auditAction: {
        USER_REGISTERED: 'User Registration',
        DOCUMENT_UPLOADED: 'Document Upload',
        APPLICATION_SUBMITTED: 'Application Submission',
        ADMIN_VERIFIED: 'Admin Verification',
        MESSAGE_SENT: 'Message Sent',
        STATUS_CHANGED: 'Status Change',
      },
    },
    home: {
      title: 'Single-source application flow',
      subtitle:
        'This prototype is a simple mobile interface that presents candidate and admin flows in a clickable format. It is intended for visual presentation only.',
      quickAccess: 'Quick Access',
      candidateScreens: 'Candidate Screens',
      adminScreens: 'Admin Screens',
      dataModel: 'Data Model',
      summary: 'Flow Summary',
      step1: '1) Registration and contact verification',
      step2: '2) Program briefing + checklist',
      step3: '3) Personal information form',
      step4: '4) Document scan / upload',
      step5: '5) Admin verification + message',
    },
    dataModel: {
      title: 'Data Model',
      subtitle: 'The information produced by each screen maps to the database.',
      users: 'identity, contact, verification, privacy consent',
      applications: 'program, form data, application status',
      documents: 'document type, file, parse result, status',
      messages: 'application-linked messaging',
      audit: 'REGISTER / SUBMIT / UPLOAD / VERIFY',
    },
    adminMenu: {
      title: 'Admin screens',
      subtitle: 'With list, verification, and audit flow.',
      applicationList: 'Application List',
      applicationDetail: 'Application Detail',
      verificationDecision: 'Verification Decision',
      auditLog: 'Audit Log',
    },
    adminAudit: {
      title: 'Audit Log',
      count: '{{count}} records',
      empty: 'There is no audit log yet.',
      userTarget: 'User: {{userId}} · Target: {{targetId}}',
    },
    documentViewer: {
      title: 'Document Viewer',
      notFound: 'Document not found.',
      noFile: 'No file yet',
      previewTitle: 'Preview (Sample)',
      previewHint:
        'Because there is no backend connection, a page-based preview placeholder is shown instead of real file rendering. In the real integration, a PDF/image viewer will open with the file URL.',
      page: 'Page {{index}}',
      parseTitle: 'Parse Result',
      verifyDecision: 'Verification Decision',
      messaging: 'Messaging',
      download: 'Download document',
      share: 'Share file',
      saved: 'The document was saved to Downloads / Inno.',
      exportError: 'The file could not be exported. Try again.',
    },
    adminListExtra: {
      refreshShort: 'Refresh',
      loadingShort: '...',
    },
  },
} as const satisfies Record<AppLanguage, TranslationObject>;

const lookupTranslation = (
  source: TranslationObject,
  segments: string[],
): TranslationNode | undefined => {
  let current: TranslationNode | TranslationObject | undefined = source;

  for (const segment of segments) {
    if (!isTranslationRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment] as TranslationNode | TranslationObject;
  }

  return current;
};

const resolveKey = (language: AppLanguage, key: string): TranslationNode | string => {
  const segments = key.split('.');
  const normalizedLanguage = normalizeLanguage(language);

  return (
    lookupTranslation(translations[normalizedLanguage], segments) ??
    lookupTranslation(translations.tr, segments) ??
    key
  );
};

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
};

export const getApplicationStatusLabel = (
  status: string,
  language: AppLanguage,
) => {
  return interpolate(String(resolveKey(language, `status.application.${status}`)));
};

export const getDocumentStatusLabel = (
  status: string,
  language: AppLanguage,
) => {
  return interpolate(String(resolveKey(language, `labels.documentStatus.${status}`)));
};

export const getDocumentTypeLabel = (
  documentType: string,
  language: AppLanguage,
) => {
  return interpolate(String(resolveKey(language, `labels.documentType.${documentType}`)));
};

export const getAuditActionLabel = (
  action: string,
  language: AppLanguage,
) => {
  return interpolate(String(resolveKey(language, `labels.auditAction.${action}`)));
};

export const useI18n = () => {
  const dispatch = useAppDispatch();
  const language = normalizeLanguage(useAppSelector(selectLanguage));

  const value = useMemo(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const resolved = resolveKey(language, key);
      if (typeof resolved !== 'string') return key;
      return interpolate(resolved, params);
    };

    const tm = (key: string) => {
      const resolved = resolveKey(language, key);
      return (Array.isArray(resolved) ? resolved : []) as TranslationObject[];
    };

    return {
      language,
      setLanguage: (nextLanguage: AppLanguage) => dispatch(setLanguage(nextLanguage)),
      t,
      tm,
    };
  }, [dispatch, language]);

  return value;
};

