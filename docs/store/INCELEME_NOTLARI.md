# inno derneği · App Review

## App Review Notes, iOS 1.0 (3)

**Purpose and audience.** inno derneği is the association's application and
mobility portal for ESC and Erasmus candidates and participants. Candidates can
see what is required, submit and track documents, and communicate privately
with the association before, during, and after mobility. It is not an official
European Commission or government app.

**Access.** Public registration requests association approval. For immediate
review, use the pre-approved candidate credentials in the private Sign-In
Information fields above. This account is assigned to a synthetic Sample
Program; no manual approval or one-time code is needed. Production staff have
separate restricted access; the review candidate cannot access staff tools or
other candidates' applications.

**How to test.**

1. Launch the app and sign in with the supplied review candidate. Open
   **Programlarım** (My Programs) and select **Mağaza İncelemesi / Sample Program**
   (the unaccented spelling may appear in the app). Review the requirements
   and the application stage.
2. Open **Belge Yükle** (Upload Document). Open the sample PDF from the document
   list or upload a new synthetic PDF. No permissions are needed to select an
   existing file. The camera permission is requested only if you choose to
   scan a document; it is not required for the review flow.
3. Open **Program Sohbeti** (Program Chat) to see the private candidate/
   association conversation. Files and messages are not posted publicly.
4. Find **Ayarlar > Gizlilik ve Hesap > Hesap Silme Talebi** (Settings > Privacy
   and Account > Account Deletion Request). This can deactivate access to the
   current account, so please do not complete it on the shared review account
   before verifying the other features.

**Services, regional availability, and permissions.** The app uses the
association's HTTPS API and private document service hosted on Natro
(`https://api.innoder.org`). There is no Google Maps, Llama, third-party
sign-in, in-app purchase, or paid feature. This release is distributed in
Türkiye; features are not switched by GPS location. An authorized association
staff member assigns programs and controls their individual requirements.

**Optional health field.** Build 3 removes blood group from the general
profile. A project-specific field can appear only for an ESC project
configured to request it, with separate, revocable opt-in. It is not required
to submit an application and is not enabled for the review program.

Privacy policy: https://api.innoder.org/privacy

Account deletion: https://api.innoder.org/account-deletion

## Fiziksel cihaz kaydı

- TestFlight'tan mağazaya gönderilen `1.0 (3)` paketini kurun. Güncel iOS sürümü
  ve iPhone modeli kayıtla birlikte not edilir.
- Odak modunu açın. Gerçek aday verisi, kişisel bildirim ve parola göstermeyin.
  iPhone Denetim Merkezi'nde Ekran Kaydı'nı başlatın; Ana Ekran'dan uygulamayı
  simgesine dokunarak açın. Simülatör kaydı eklemeyin.
- Giriş, atanan örnek program, belge gereksinimi, örnek PDF açma veya yükleme
  ve program sohbetini tek akışta gösterin. Ardından Ayarlar'da hesap silme
  seçeneğini açın. Silme işlemini sonuna kadar göstermek gerekirse ayrı bir
  sentetik hesap kullanın; Apple'a tanımlı hesabı silmeyin veya parolasını
  değiştirmeyin.
- Fiziksel kayıt alınmadan dosya adı, bağlantı veya cihaz testi sonucu
  App Review notlarına eklenmez.

## Veri beyanı kontrolü

Bu bölüm çalışma notudur; mağaza formu veya kurum onayı değildir.

| Veri | Hizmetteki kullanım |
| --- | --- |
| Ad, e-posta, telefon, kullanıcı kimliği | Kayıt, hesap yönetimi ve iletişim |
| Kimlik/pasaport bilgileri, uyruk ve doğum tarihi | Başvuru ve program işlemleri |
| Sağlık / Kan grubu | Yalnız bu bilgiyi isteyen ESC projesi için ayrı ve geri alınabilir açık rızayla; başvuru için zorunlu değil. Kimlikle bağlantılı, uygulama işlevi için, takip yok. |
| CV, motivasyon, PDF, fotoğraf ve diğer belgeler | Başvuru ve belge inceleme |
| Uygulama içi mesajlar ve denetim kayıtları | Başvuru desteği ve idari işlemlerin takibi |

Son imzalı pakette SDK ve ağ davranışı doğrulanmadan takip, paylaşım,
saklama veya veri silme hakkında kesin mağaza beyanı verilmez. Kurum
onayı, hesap silme testi ve çalışan destek kanalı gönderim öncesi tamamlanır.
