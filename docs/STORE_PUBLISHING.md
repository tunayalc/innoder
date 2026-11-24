# Inno Derneği Mağaza Yayını

## 21 Kasım 2026 · Google Play

Yayın için seçilen geliştirici hesabı `ytunahan7878`. Uygulama desteği, gizlilik ve hesap silme işlemleri İnno Derneği tarafından yürütülür. Derneğin [destek](https://api.innoder.org/support), [gizlilik](https://api.innoder.org/privacy) ve [hesap silme](https://api.innoder.org/account-deletion) sayfaları herkese açık olarak doğrulandı.

Android 1.0 (3), `org.innoassociation.mobile` kimliği ve mevcut Play yükleme anahtarı ile üretildi. Bu derlemede kan grubu yalnız bunu isteyen ESC projelerinde adayın ayrı, geri alınabilir rızasıyla işlenir. Paketin sürümü, API 36 hedefi, üretim imzası, 16 KB paket hizalaması ve 34 adet 64 bit yerel kitaplık doğrulandı. Mobil TypeScript kontrolü ve 75 test geçti. Üretim paketi `output/store-prep/InnoDernegi-1.0-build-3-play-signed.aab`, SHA-256 `71387e200a7746e717891752511a414385713e9dea665d0d02466b20c24474a2`. Google Play gönderimi bekliyor. [Mağaza metinleri ve Google Play beyanları](store/MAGAZA_TURKCE.md)

Android 16 emülatöründe üretim paketinden oluşturulan APK açıldı ve Türkçe giriş ekranı kaydedildi. Aynı kaynakla ve örnek aday verileriyle hazırlanan mağaza önizlemesinde başvuru özeti, program listesi ve program detayı kaydedildi. Dört telefon görseli `output/store-prep/play-android-build-3/` altında 1080 × 1920 RGB PNG biçimindedir. Google Play yüklemesine ait AAB, görseller ve Türkçe metinler `output/store-prep/InnoDernegi-1.0-build-3-play-teslim.zip` dosyasındadır.

## 20 Kasım 2026 · Önceki Kontrol

- Apple Developer üyeliği aktif ve bireysel. [Inno Derneği iOS 1.0 taslağı](https://appstoreconnect.apple.com/apps/6837313377/distribution/ios/version/inflight) oluşturuldu; Türkçe açıklama, destek adresi, alt başlık ve Eğitim kategorisi kaydedildi.
- iOS 1.0 (1) paketi Apple tarafından işlendi ve şifreleme beyanı tamamlandı. Eğitim videoları içeren bu derleme, yeniden seçilebilmesi için hesapta bırakıldı ancak 1.0 taslağından ayrıldı. Sürüm `Prepare for Submission` durumunda; incelemeye gönderilmedi.
- Dört iPhone ekran görüntüsü Türkçe ürün sayfasına bağlandı. Ücretsiz fiyat, yaş derecelendirmesi, İngilizce inceleme notları ve onaydan sonra elle yayınlama seçeneği kaydedildi.
- İlk dağıtım bölgesi Türkiye olarak kaydedildi. Canlı API'de yalnız örnek başvuruya erişen aday hesabının girişi, dosya yükleme ve açma, anonim erişimin reddedilmesi ve mesaj ekranı doğrulandı. Hesap ve güncel notlar Apple'ın özel inceleme alanında kayıtlıdır.
- Eğitim videoları ikinci derlemeden ve kayıt şartlarından çıkarıldı. Ham dosyalar Natro'da `/var/lib/inno/private-media/training/` altında, bir HTTP yolu veya konteyner bağlantısı olmadan saklanıyor. Yerel kopyalar `server/private-media/training/` altında.
- iOS 1.0 (2), yeni yerel Apple Distribution kimliği ve `Inno Association App Store Distribution` profiliyle imzalandı. Profil yalnızca `org.innoassociation.mobile` ile yeni sertifikayı içerir; 20 Kasım 2027'ye kadar geçerli. Özel anahtar bu Mac'in Anahtar Zinciri'nde, önceki sertifikalar iptal edilmedi. İmzalı kopya `output/store-prep/ios-distribution-build-2-local-signing/InnoAssociation.ipa` altında. Apple paketi işledi, şifreleme beyanı kaydedildi ve derleme 2 sürüm taslağına bağlandı. Sürüm `Prepare for Submission` durumunda ve incelemeye gönderilmedi. Hermes hata ayıklama sembolü yükleme uyarısı paketin kabulünü engellemedi.
- `2026 İnno Derneği` telif bilgisi ve 1.0 (2) için içerik hakları beyanı App Store Connect'e kaydedildi. App Privacy veri türleri taslakta; geçerli gizlilik metni ve veri beyanının yayımlanması bekliyor. Mevcut gizlilik URL'si yayıma hazır metin sunmuyor. Kan grubu alanı mevcut sürümde isteğe bağlı; kayıt ekranında ayrıca kan grubuna özgü rıza alınmıyor.
- Play Console'da görünen kişisel hesapta satıcı statüsü, Android cihazı, kimlik ve telefon doğrulaması tamamlanmamış. Bir kuruluş hesabına erişim görülmedi.
- Android 1.0 (2) paketi debug olmayan Play yükleme anahtarıyla temiz derlenip imzalandı. İmza, Bundletool, API 36, 16 KB paket hizalaması ve 34 adet 64 bit kütüphane hizalaması doğrulandı. APK/AAB ve IPA kontrollerinde eğitim videoları yok. Google Play'e yükleme yapılmadı.
- `output/store-prep/` altında AAB, dört iPhone görüntüsü ve mağaza dosyalarının ZIP'i var. Google Play için Android ekran görüntüleri ve iki platform için son cihaz kabulü bekliyor.
- [Devir ve yayın](store/DEVIR_VE_YAYIN.md), [Türkçe mağaza metinleri](store/MAGAZA_TURKCE.md) ve [inceleme notları](store/INCELEME_NOTLARI.md) güncel hazırlık dosyalarıdır.

## Önceki Kayıt

Son yerel teknik kontrol: 13 Kasım 2026. Kurum hesabı kayıt notları: 29 Eylül 2026.

Yeni tema, Android imzasız APK/AAB derlemesi, 16 KB hizalama kontrolleri ve
150 uygulama/API/web testi ile 10 yayın kontrol testi yerelde tamamlandı.
Bu sonuçlar mağaza yayınının tamamlandığı anlamına gelmez. Tam kontrol kaydı ve
kalan cihaz/imzalama/hukuki hazırlıklar için `QA_STORE_READINESS.md` dosyasına bakın.
Bu turda canlı siteye yayın veya mağazaya gönderim yapılmadı.

### Önceki hesap durumu

Uygulama henüz App Store veya Google Play incelemesine gönderilmedi.
Derneğin geliştirici hesapları henüz açılmadı.

İnno Derneği Chrome profilinde Google Play kayıt akışı açıldı.
Hesap türü "Sivil toplum kuruluşu", geliştirici adı "Inno Derneği" seçildi.
Akış kuruluşun ödeme profilini bağlama adımında bekliyor. Ödeme yapılmadı,
üyelik sözleşmesi kabul edilmedi ve geliştirici hesabı oluşturulmadı.
Apple Developer kaydı Apple hesabı giriş ekranında bekliyor.

### Kurum kaydı

- [Google Play kaydı](https://play.google.com/console/signup): tek seferlik 25 USD.
- [Apple Developer kaydı](https://developer.apple.com/programs/enroll/): normal üyelik 99 USD/yıl.
- [Apple ücret muafiyeti](https://developer.apple.com/help/account/membership/fee-waivers): koşulları sağlayan kâr amacı gütmeyen kurumlar başvurabilir; onay garanti değildir.
- [D-U-N-S bilgisi ve numara başvurusu](https://developer.apple.com/help/account/membership/D-U-N-S): her iki kuruluş hesabının doğrulaması için kurumun dokuz haneli numarası gerekir.

Kuruluş kaydı için derneğin resmî tam adı, kayıtlı adresi, D-U-N-S numarası,
kurumu temsil etmeye yetkili kişi, telefon ve kurumsal e-posta hazırlanmalıdır.
Apple kuruluş kaydında kurumun alan adına bağlı iş e-postası ister.
Google Play'de açık olan hesap innodernegi@gmail.com; kayıt ekranı kurumun
alan adına bağlı Google hesabını öneriyor. Hesap sahibi seçimi yetkili kişiyle
netleştirilmelidir. Gerçek kişi adı gerektiren alanlara dernek adı yazılmamalıdır.

Kaynaklar: [Google hesap açılışı](https://support.google.com/googleplay/android-developer/answer/6112435),
[Google kuruluş gereklilikleri](https://support.google.com/googleplay/android-developer/answer/13628312),
[Apple kuruluş gereklilikleri](https://developer.apple.com/programs/enroll/).

### Önceki teknik durum

| Alan | Durum |
| --- | --- |
| Android applicationId | `org.innoassociation.mobile` |
| iOS bundle identifier | `org.innoassociation.mobile` |
| Android/iOS sürümü | `1.0`, derleme numarası `1` |
| Android hedef SDK | API 36 |
| Android imzası | Yerel ayar debug.keystore / androiddebugkey kullanıyor; mağaza için upload anahtarı gerekiyor |
| iOS derleme ortamı | Bu bilgisayarda tam Xcode kurulumu bulunamadı |
| iOS imzası | Geçerli codesigning kimliği yok; kurum takımı ve dağıtım profili gerekiyor |
| Üretim bağlantısı | Release derlemelerinde gerçek API kullanılıyor |
| Gizlilik URL'si | https://api.innoder.org/privacy erişilebilir; kurum bilgileri tamamlanmamış taslak |
| Hesap silme URL'si | https://api.innoder.org/account-deletion |

Android için imzalı AAB, iOS için kurum hesabıyla imzalı arşiv hazırlanmalıdır.
Mevcut debug imzalı Android derlemesi mağazaya sunulmamalıdır.
Apple yüklemesi Xcode 26 veya sonrası ve iOS 26 SDK veya sonrasını gerektirir.
Google Play yeni uygulama yüklemesinde API 36 veya sonrasını gerektirir.
Kaynaklar: [Apple SDK koşulu](https://developer.apple.com/news/upcoming-requirements/?id=02032026a),
[Google hedef SDK koşulu](https://support.google.com/googleplay/android-developer/answer/11926878).

## Mağaza metni taslağı

Uygulama adı: Inno Derneği

Kısa açıklama: ESC ve Erasmus başvurularınızı, belgelerinizi ve hareketlilik sürecinizi yönetin.

Tam açıklama:

Inno Derneği uygulaması, derneğin ESC ve Erasmus programlarına katılan
adayların başvuru ve hareketlilik süreçlerini takip etmelerini sağlar.

Adaylar kişisel bilgilerini düzenleyebilir, gerekli belgelerini yükleyebilir,
belge değerlendirmelerini görebilir ve dernek yetkilileriyle mesajlaşabilir.
Başvuru, hareketlilik ve ülkeye dönüş aşamaları aynı uygulamadan takip edilir.

Yetkili dernek personeli aday kayıtlarını ve başvuruları inceleyebilir,
belgelerin durumunu güncelleyebilir ve süreçle ilgili iletişimi yürütebilir.
Kayıt talepleri dernek tarafından değerlendirilir.

Taslak kategorisi: Eğitim. Hedef kitle, yaş derecelendirmesi, yayın ülkeleri ve
fiyat tercihi mağaza formları doldurulmadan önce kurumla netleştirilmelidir.

## İncelemeye gönderilecek içerikler

- Son imzalı sürümün gerçek cihaz ekran görüntüleri ve Google Play özellik görseli.
- Kurumca tamamlanmış gizlilik metni, destek adresi ve veri silme açıklaması.
- Uygulama ile SDK davranışlarına uygun App Privacy / Data Safety beyanları.
- İnceleme ekibinin aday ve yönetici akışlarını test edebileceği ayrı hesaplar; gerçek aday belgeleri kullanılmamalıdır.
- Gerçek API üzerinde kayıt, giriş, şifre değiştirme, PDF/görsel yükleme ve hesap silme akışlarının son cihaz kontrolü.

Kurum hesabı doğrulanıp teknik ve içerik eksikleri tamamlandıktan sonra
Google Play test yayını ve App Store Connect/TestFlight yüklemesi yapılabilir.
Mağazaların inceleme kararı ve yayın tarihi gönderimden sonra belirlenir.
