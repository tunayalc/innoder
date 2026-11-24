# Yayın ve kurumsal devir

## Google Play yayın tercihi

21 Kasım 2026’da seçilen hedef, mevcut kişisel geliştirici hesabı `ytunahan7878` üzerinden Google Play dağıtımıdır. Uygulama desteğini, gizlilik başvurularını ve hesap silme iletişimini İnno Derneği yürütür. Herkese açık uygulama destek adresi innodernegi@gmail.com, destek sayfası https://api.innoder.org/support, gizlilik metni https://api.innoder.org/privacy ve silme sayfası https://api.innoder.org/account-deletion adresindedir. Geliştirici hesabı sahibine ait Google doğrulama ve kimlik alanları ayrı tutulur.

Hesap türü değerlendirilirken uygulamanın derneğin aday ve başvuru işlemlerini yönettiği ve belirli ESC projelerinde isteğe bağlı kan grubu bilgisini işlediği açıklanır. Google, kuruluş için oluşturulan hesaplarda kuruluş türünü seçmeyi öngörür. Hesabın doğrulanması, kişisel yayıncının bu uygulama için Google tarafından kabul edildiğini tek başına göstermez. [Google Play hesap türleri](https://support.google.com/googleplay/android-developer/answer/13634885?hl=tr)

## Önceki mağaza ve devir planı

- Her iki platformda `org.innoassociation.mobile` paket kimliği ve mevcut Natro API adresi korunur.
- Apple tarafında mevcut üyeliğin derneğe geçirilmesi veya derneğin ayrı takımına yetkili erişim alınması gerekiyor. Teyit edilecek bilgiler: resmî unvan ve adres, D-U-N-S, dernek adına yetkili temsilci ve kurumsal e-posta. Apple isterse tescil/temsil evrakları doğrudan Apple'a iletilir.
- Geçmiş planda Google Play için dernek hesabı değerlendirilmişti. Kişisel hesapla gönderim yapılacaksa Play Console hesap doğrulamaları ve uygulanıyorsa kapalı test ile üretim erişimi gerekir.

## Yayın kişisel hesapta başlarsa

- Apple devri için en az bir App Store sürümü yayımlanmış olmalı; TestFlight veya taslak devredilebilir bir yayımlanmış sürüm değildir. Her iki hesap uygun durumda olmalı. Alıcı takım sonraki güncellemeyi kendi imzalama profiliyle hazırlar. Apple takım değişikliğinden sonra Keychain oturumunun yenilenmesi gerekebileceğini test edin.
- Google devri için kaynak ve hedef Play Console hesapları kayıtlı ve aktif olmalı. Play App Signing'i koruyun. Gerekirse alıcı hesap sahibi yükleme anahtarının sıfırlanmasını ister. Özel yükleme anahtarı ve parolası kaynak koduna, sohbete veya mağaza dosyalarına eklenmez.
- Mağaza devri Natro sunucusunu, veritabanını, DNS'i veya yedekleri taşımaz. Bunlar için ayrıca kurum adına erişim, sorumluluk ve geri yükleme testi planlanır.

## Dernekten beklenenler

- Kuruluş için yukarıdaki doğrulanmış bilgiler ve onaylı gizlilik/KVKK metni. Kan grubu gerekliliği, kimlerin hangi verilere eriştiği, aktarım, saklama ve silme koşulları açıkça teyit edilecek.
- Son sürümde uygulama içi silme ve dış web talebi, şifre sıfırlama ve destek akışı doğrulanacak. Test hesapları gerçek aday verisini görmeyecek.

## Yerel Android imzası

Bu Mac'teki ayrı Play yükleme anahtarıyla yeniden paketlemek için depo kökünde
`bash scripts/store/build-play-local.sh` çalıştırılır. Parola macOS Anahtar
Zinciri'nden okunur. Anahtar hiçbir Google hesabına kaydedilmedi. Dernek ilk
yüklemeden önce anahtarın kurumsal saklamasını onaylar veya kendi yükleme
anahtarıyla paketi yeniden imzalar. Play App Signing'deki dağıtım anahtarı,
yerel yükleme anahtarından ayrıdır.

Kaynaklar: [Apple hesap kaydı](https://developer.apple.com/programs/enroll/) · [Apple devir koşulları](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria/) · [Google Play devir koşulları](https://support.google.com/googleplay/android-developer/answer/6230247) · [Google Play kapalı test](https://support.google.com/googleplay/android-developer/answer/14151465)
