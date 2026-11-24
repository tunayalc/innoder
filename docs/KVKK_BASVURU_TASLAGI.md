# İnno Derneği Uygulaması: Gizlilik Politikası ve KVKK Aydınlatma Metni

20 Kasım 2026 tarihli çalışma metni. **Bu dosya kullanıcıya sunulan politika
değildir.** 21 Kasım 2026 güncellemesinin yayımlanacak sürümü API'nin
[`/privacy` sayfasında](https://api.innoder.org/privacy) sunulur. Aşağıdaki
taslak ve kontrol listesi önceki değerlendirmeyi belgelemek için tutulur.

## Adaya gösterilecek metin

**Veri sorumlusu:** İNNO Derneği [veri sorumlusu sıfatı teyit edilecek].
**KVKK başvuru e-postası ve uygulama desteği:** [innodernegi@gmail.com](mailto:innodernegi@gmail.com).
**Posta iletişim adresi:** Zincirlikuyu Mahallesi, İkizkavak Caddesi No: 9B, Tepebaşı / Eskişehir, Türkiye.
**Metin sürümü ve yürürlük tarihi:** [onaydan sonra eklenecek].

Bu metin, Inno Derneği mobil uygulaması ve başvuruları yönetmek için kullanılan
yönetim paneli kapsamında kişisel verilerinizin nasıl işlendiğini açıklar.

### Hangi verileri neden işliyoruz?

Veriler, kayıt ve profil formlarına yazdığınız bilgilerden, seçtiğiniz veya
kamerayla çekerek yüklediğiniz belgelerden, uygulama içi yazışmalardan ve
sistem işlemleri sırasında oluşan kayıtlardan toplanır. Kamera izni vermezseniz
uygun belgeleri cihazınızdan seçip yükleyebilirsiniz.

| Veri grubu | İşleme amacı | Hukuki sebep |
| --- | --- | --- |
| Ad, e-posta, başvurmak istediğiniz etkinliğin bağlantısı; profilinizde eklediğiniz diğer iletişim bilgileri | Kayıt talebini değerlendirmek, hesabı açmak ve sizinle iletişim kurmak | [6698 sayılı Kanun m. 5 kapsamındaki işleme şartı] |
| Doğum tarihi, uyruk, kimlik veya pasaport bilgisi, CV, motivasyon, programa özgü belgeler ve seyahat bilgileri | Başvuruyu değerlendirmek; ilgili programın belge, hareketlilik ve dönüş işlemlerini yürütmek | [Hangi veri hangi aşamada gerçekten gerekli ve hangi m. 5 şartına dayanıyor?] |
| Uygulama içi mesajlar, belge inceleme notları ve başvuru durumu | Size destek vermek, eksik belgeleri bildirmek ve başvurunuzun durumunu göstermek | [m. 5 işleme şartı] |
| Hesap kimliği, oturum bilgileri, işlem zamanı ve işlem kayıtlarındaki IP adresi | Hesap ve sistem güvenliği, yetki kontrolü ve idari işlemlerin denetlenmesi | [m. 5 işleme şartı ve kayıt kapsamı] |
| İsteğe bağlı kan grubu | Bu bilgiyi isteyen Avrupa Dayanışma Programı (ESC) projesinin başvuru ve hareketlilik işlemleri | Sadece ilgili başvuru için verilen ve geri alınabilen açık rıza (m. 6/3-a) |

Kan grubu kayıt sırasında veya genel profilde istenmez. Yalnızca bu bilgiyi
isteyen bir ESC projesinde, ayrı açık rıza vererek o başvuruya ekleyebilirsiniz.
Paylaşmamak başvuruya engel değildir. Değer şifreli saklanır, diğer başvurulara
kopyalanmaz veya dışa aktarımlara eklenmez. Yalnız adayın kendisi ve yetkili
yöneticiler görür. Yönetici görüntülemeleri ve rıza işlemleri, sağlık değeri
yer almadan denetim kaydına yazılır.

Başvuru ayrıntısında **Rızamı geri al** seçeneğiyle değeri silebilirsiniz.
Proje bu bilgiyi istemeyi bırakırsa, arşivlenirse, başvuru reddedilirse veya
dönüş tamamlanırsa kayıt da silinir. Sağlık kayıtları uygulamanın günlük
PostgreSQL yedeklerine dahil edilmez; sağlayıcının disk görüntüleri ayrı bir
süreçtir ve varsa ilgili saklama ve imha süreleri ayrıca teyit edilir.

### Kimler erişebilir, kimlere aktarılabilir?

Başvuru bilgilerine işlemleri yürüten yetkili yöneticiler erişir. Aday belgeleri
herkese açık bağlantılarla sunulmaz. Yönetici bir belge kopyasını dışarıya
paylaşabilir; bu tür paylaşım yalnızca aşağıda belirtilen, derneğin onayladığı
alıcılar ve amaçlar için yapılır.

- **Barındırma:** Uygulamanın sunucusu Natro üzerinde çalışır. Bu altyapı uygulamayı çalıştırmak, başvuru kayıtlarını ve belgeleri saklamak için kullanılır. [Hizmet sağlayıcının erişim kapsamı ve sözleşmeyle uygulanan korumalar teyit edilecek.]
- **Program ortakları, kurumlar ve teknik hizmet sağlayıcılar:** [Fiilen hangi alıcılara hangi veriler, ne amaçla ve hangi şartla aktarılıyor? Aktarım yoksa açıkça belirtilecek.]
- **Yurt dışı:** Sistem program ortaklarına otomatik dosya göndermek üzere yapılandırılmadı. Yönetici tarafından uygulama dışından yapılan aktarımlar bu tespitin dışındadır. [Fiilî aktarım varsa alıcı, veri, amaç ve aktarım güvencesi belirtilecek.]

### Ne kadar saklanır ve nasıl silinir?

Mevcut sistemde bir başvurunun reddedilmesi veya tamamlanması, o başvurunun
kayıtlarını kendiliğinden silmez. Canlı başvuru ve belge kayıtları için
[reddedilen, vazgeçilen ve tamamlanan başvuruların uygulanacak süreleri ve
başlangıç olayları]; denetim kayıtları ve indirilen kopyalar için [saklama ve
silme kuralları] belirtilmelidir. Yerel şifreli yedekler yaklaşık 30 gün sonra
otomatik temizlenir. Bu süre, canlı başvuru kayıtlarının saklama süresi değildir.

Hesap silme talebini **Ayarlar > Gizlilik ve Hesap > Hesap Silme Talebi**
yolundan başlatabilirsiniz. Uygulamaya erişemiyorsanız [Hesap ve Veri Silme
sayfasındaki](https://api.innoder.org/account-deletion) başvuru yolunu
kullanabilirsiniz. Yetkili ekip, kimlik doğrulamasından sonra talebi işler.
Sistem, oturumu kapatır, profil bilgilerini anonimleştirir ve başvuru
belgelerinin temizliğini başlatır. Yasal saklama gereği olan sınırlı kayıtların
kapsamı ve süresi yukarıda ayrıca belirtilir. Şifrenizi veya kimlik belgenizi
e-postaya eklemeyin.

### Haklarınızı nasıl kullanırsınız?

6698 sayılı Kanun'un 11. maddesi kapsamında; verilerinizin işlenip işlenmediğini
öğrenebilir, işleniyorsa bilgi isteyebilir, işleme amacını ve amaca uygun
kullanımı öğrenebilir, yurt içi veya dışındaki alıcıları öğrenebilirsiniz.
Eksik veya yanlış verilerin düzeltilmesini ve şartları oluştuğunda silinmesini
veya yok edilmesini, bu işlemlerin alıcılara bildirilmesini isteyebilirsiniz.
Yalnızca otomatik analizden doğan aleyhinize bir sonuca itiraz edebilir ve hukuka
aykırı işlemeden doğan zararınızın giderilmesini isteyebilirsiniz. İşlem açık
rızaya dayanıyorsa rızanızı da KVKK başvuru kanalı üzerinden geri alabilirsiniz.
E-posta ile başvururken sistemimizde kayıtlı e-posta adresinizi kullanın ve
mesajın konusuna `KVKK Başvurusu` yazın.

## Derneğin dolduracağı onay listesi

1. **Sorumlu ve iletişim.** [Tüzüğün 1. maddesi](https://www.innoder.org/tuzugumuz/)
   resmî adı İNNO Derneği ve merkezi Eskişehir olarak gösteriyor. Posta
   iletişiminde, [derneğin iletişim sayfasındaki](https://www.innoder.org/iletisim/)
   ana adres ile [Türkiye Ulusal Ajansı Eurodesk listesinin](https://eurodesk.ua.gov.tr/information-points?listType=all)
   eşleştiği Zincirlikuyu adresi kullanıldı. Bu, dernek sicilinin teyidi değildir.
   E-posta kanalı `innodernegi@gmail.com` olarak belirlendi. Veri sorumlusu
   sıfatını ve başvuruları yanıtlayacak birimi teyit edin.
2. **Gereklilik ve hukuki sebepler.** Kan grubunun bazı ESC projelerinde
   istendiği ve özelliğin korunacağı teyit edildi. Bu talep tek başına sağlık
   verisi için m. 6 kapsamında hukuki şart oluşturmaz. Tablodaki her işlem için
   geçerli dayanağı belirleyin. Yeni sürüm kan grubunu yalnız isteğe bağlı ve
   geri alınabilir proje rızasıyla işler. Sağlık alanı açılmadan projenin
   gerekliliğini ve ilgili idari önlemleri doğrulayın. Genel kayıt akışındaki
   rıza ayrı bir konudur; diğer veri işlemlerinin dayanağını ayrıca belirleyin.
3. **Paylaşım ve saklama.** Natro, proje ortakları, kamu kuruluşları, e-posta
   ve yedek sağlayıcılarından hangilerinin hangi veriye eriştiğini belirtin.
   Yurt dışı aktarımı varsa ülkeleri ve güvenceleri doğrulayın. Başvuru durumu,
   belgeler, işlem kayıtları ve yedekler için süreleri ve dışarı alınan belge
   kopyalarının silinmesinden sorumlu birimi belirtin.
4. **Mağaza telifi tamamlandı.** Kullanıcının verdiği `2026 İnno Derneği` bilgisi
   App Store Connect'e kaydedildi. Bu bilgi kişisel verilerin işleme şartlarını
   veya gizlilik metninin yayıma hazır olduğunu göstermez.

Onaydan sonra metni uygulamanın zaten açtığı `https://api.innoder.org/privacy`
adresine koyun. Kayıt ve Ayarlar bağlantılarını kontrol edin, App Store
Connect'teki gizlilik bağlantısını ve veri beyanını nihai metinle eşleştirin.

## Uygulama ve işletim notları

- Harici paylaşım, herkese açık dosya bağlantısı üretmez. Yetkili admin, dosyanın
  bir kopyasını cihazın paylaşım menüsüne verebilir. Göndermeden önce alıcının,
  paylaşım amacının ve kanalının dernek politikasına uygunluğu kontrol edilmelidir.
- Yerel şifreli yedek 19 Kasım 2026'da ağ erişimi olmayan ayrı bir PostgreSQL
  konteynerinde geri yüklenebildi. Test anlık görüntüsünde başvuru veya belge
  yoktu; belge bütünlüğü için örnek belge içeren ayrı bir test daha gerekir.
- [Natro XCloud kılavuzu](https://www.natro.com/hemendestek/bilgibankasi/xcloud-sunucu-hizmetinde-yedekleme-nasil-yapilir)
  sağlayıcı tarafından oluşturulan yedeklerin panelde listelendiğini açıklar.
  Natro'dan saklama konumu, VM diski/ana makine/datacenter kaybında geri yükleme,
  ayrı bir sunucuya taşıma, otomasyon, süre ve şifreleme için yazılı bilgi alınmalıdır.
  Yedek yuvası hakkı, çalışır ve güncel sunucu dışı yedek anlamına gelmez.
- Gmail ile şifre sıfırlama ve arıza e-postası, kullanıcı talebiyle ertelendi.
- 20 Kasım 2026 canlı kontrolünde SMTP ve otomatik sunucu dışı kopya ayarlı
  değildi. Güncel şifreli yerel yedek görüldü ve yaklaşık 30 günlük otomatik
  temizlik kuralı doğrulandı. Bu kontrol, manuel e-posta veya belge paylaşımının
  yapılıp yapılmadığını ve harici kanalın ülkesini göstermez.

Dayanaklar: [Aydınlatma Tebliği](https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig),
[KVKK başvuru usulü](https://www.kvkk.gov.tr/Icerik/6938/Kurumumuza-Yapilan-Sikayetlerin-Usul-Sartlarina-Iliskin-Kamuoyu-Duyurusu),
[özel nitelikli veriler](https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber),
[yurt dışı aktarım rehberi](https://www.kvkk.gov.tr/Icerik/8143/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi),
[Apple App Review gizlilik kuralları](https://developer.apple.com/app-store/review/guidelines/#privacy),
[Apple telif alanı](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information).
