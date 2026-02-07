# Mobil_Uygulama.pptx (Extract)

This file is generated from the canonical presentation in this repo:
- `Mobil_Uygulama.pptx`
- SHA256: `f379d6abd20088d0c9d309c7c2fc665b5a9ab2083d70c9e1e6a70d8442aa33b8`
- Extracted at: `2026-02-07T19:49:19`

The presentation remains the single source of truth; this is a convenience extract for development.

## Slide 1: Kapsamlı Mobil Uygulama Tasarımı

- Ana Modüller (Kullanıcı/Aday)
- 1) Kayıt Formu 2) Katılım Bilgilendirme Formu ("Eğitim Formu") 3) Kişisel Bilgi Transferi (Server/DB) 4) Mesajlaşma (Aday ↔ Admin) 5) Kamera ile Belge Tarama/Yükleme (çok belge türü)
- Admin Kanalları (İki Kanallı)
- • Admin Mobil: liste, belge görüntüleme, doğrulama, hızlı mesaj • Mevcut Admin Web Panel: aynı kayıtlar, filtreleme/doğrulama • Tek gerçek kaynak: ortak backend + ortak DB
- Özet Mimari (Single Source of Truth)
- Mobil (iOS/Android)
- Ortak Backend API (Auth + Business)
- Ortak DB
- Mevcut Admin Web Panel

Notes:

Kapak: Proje kapsamı ve "tek gerçek kaynak" (ortak backend + DB) yaklaşımı özetlenir. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 2: Problem & Motivasyon

- Tipik Sorunlar (Sahadaki Senaryolar)
- Süreç uzuyor: Adayın eksik/yanlış bilgi veya belge göndermesi, tekrar tekrar iletişim ve revizyon döngüsü yaratıyor. Takip zor: Adminler başvuruları farklı kanallardan (telefon, e‑posta, mesaj) dağınık takip ediyor; “hangi belge kimde eksik?” net değil. Belge çeşitliliği: Sadece tek bir belge (örn. bilet/boarding pass) değil; farklı programlar için farklı belgelerde farklı eksikler oluşabiliyor. Doğrulama tutarsızlığı: Aynı başvuru hem mobilde hem webde görülmezse (veya farklı listeler oluşursa) “tek doğru” kayboluyor. (mobilin olduğu senaryoda) Gecikme maliyeti: Başvuru kapanış tarihleri, kontenjan, operasyonel planlama gibi kararlar eksik bilgi yüzünden gecikiyor. Denetlenebilirlik eksik: “Kim hangi belgeyi ne zaman onayladı?” izlenemezse itiraz/hataya geri dönüş zorlaşıyor.
- Problem / Senaryo
- Aday belgeyi geç/eksik yükler → Admin tekrar ister → süreç 2–3 tur uzar. Yanlış format/okunmayan fotoğraf → “belge var gibi” görünür ama içerik doğrulanamaz.
- Çözüm (Uygulama + Sunucu/DB)
- Tüm veri ve belgeler tek akışla server’a iletilir; DB’de tekil kayıt oluşur (single source of truth). Belge durumları standartlaştırılır (OK/EKSİK/YANLIŞ FORMAT/OKUNMADI). Admin mobil + mevcut web panel aynı kayıtları, aynı doğrulama geçmişini görür.

Notes:

Motivasyon: Eksik/yanlış belge-bilgi nedeniyle süreç uzaması ve admin tarafında iki kanallı (mobil+web) görünürlük ihtiyacı problemleştirilir. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 3: Amaç & Başarı Ölçütü

- Proje Amaçları (Problem → Çözüm)
- Hedeflenen Etki
- Eksik/yanlış belge sayısını azaltmak: Adayı daha başta doğru belge/alanlara yönlendirmek (checklist + uyarılar). Kayıt altına almak: Tüm form verileri + belge yükleri sunucuya iletilir ve DB’de sürümlü biçimde saklanır. Adminin işini hızlandırmak: Admin mobilde “liste → detay → doğrulama → mesaj” akışıyla hızlı geri dönüş sağlar. Mevcut web panel ile tam senkron: Web tarafı aynı başvuru/ belge kayıtlarını görür; kararlar çakışmaz. Şeffaflık ve izlenebilirlik: Audit log ile “kim-ne-zaman-ne yaptı” kayıtlanır.
- Başarı Ölçütleri (KPI)
- Nasıl Ölçeriz?
- Eksik belge oranı: “EKSİK/OKUNMADI/YANLIŞ FORMAT” statülerinin toplamı ↓ (başvuru başına). İlk geri dönüş süresi: Başvuru oluşturma → admin ilk mesaj/onay zamanı ↓. Doğrulama çevrim sayısı: Başvuru başına “yeniden yükle” talebi ↓. Admin görünürlük tutarlılığı: Mobil ve web panelde aynı başvuru sayısı ve aynı durumlar %100 eşleşir. Kayıt bütünlüğü: Her kritik aksiyonun audit log’u bulunur (silinmez, izlenebilir).
- Problem / Senaryo
- “Belge yüklendi” demek yetmez: içerik okunabilir ve doğrulanabilir olmalı. Adminin yalnızca webde görmesi yetersiz: sahada mobil listeden hızlı aksiyon şart.
- Çözüm (Uygulama + Sunucu/DB)
- Server tarafında doğrulama + DB statüsü: her belge için durum, hata kodu, işlenme zamanı kaydı. Admin mobil + web ortak endpointlerle aynı DB kayıtlarını tüketir; tek kaynaktan karar verilir.

Notes:

Amaç ve KPI’lar, “server’a iletme + DB’ye kaydetme + adminin mobil/webde görmesi” ana hedefi etrafında tanımlanır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 4: Kapsam

- Kapsam Dahil
- Kayıt Formu: aday temel hesap oluşturma + iletişim bilgileri + doğrulamalar (server tarafı). “Eğitim Formu” (Katılım Bilgilendirmesi): programlara nasıl katılınır, adımlar, gerekli belgeler, checklist, sık hatalar. Kişisel Bilgi Transferi: adayın formlarla verdiği kişisel verilerin güvenli biçimde server’a iletimi ve DB’ye kaydı. Mesajlaşma: aday ↔ admin arasında kanıtlanabilir, kayıtlı iletişim; eksik belge bildirimleri. Kamera ile Belge Tarama/Yükleme: belge görüntüsünden veri okuma / QR‑barcode parse / kalite kontrol; server’a iletme + DB kaydı. Admin Mobil: başvuru listesi, belge görüntüleme, doğrulama, hızlı mesaj, durum güncelleme. Mevcut Admin Web Panel: aynı başvurular, aynı belgeler, aynı doğrulama statüleri (ortak backend/DB).
- Kapsamın “çekirdeği”
- • Veri akışı tek yönlü ve izlenebilir: Mobil/Web → Backend → DB. • Her modülün çıktısı DB’de kalıcı kayda dönüşür (form, belge, mesaj, doğrulama). • Adminler iki kanaldan aynı listeyi görür; farklı “liste” yoktur. • Belge tarama özelliği sadece “boarding pass” ile sınırlı değildir; belge türleri genişletilebilir. • Durum yönetimi standart: OK/EKSİK/YANLIŞ FORMAT/OKUNMADI + açıklama.

Notes:

Kapsam slaytı: kullanıcı modülleri + admin mobil listesi + mevcut web panel senkronu netleştirilir; kapsam dışı başlık eklenmez. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 5: Koordineli Yapı: Mobil + Mevcut Web + Ortak Backend + Ortak DB

- Senkronun Mantığı
- Tek gerçek kaynak yaklaşımı: Mobil uygulama ile mevcut web panel aynı backend API’lerine gider ve aynı DB’yi kullanır. Amaç: “mobilde var, webde yok” veya “webde onaylandı ama mobilde görünmüyor” gibi tutarsızlıkları tasarımdan engellemek. Kayıt mantığı: Her form gönderimi, belge yükü, mesaj ve doğrulama işlemi bir DB kaydı ve audit log satırı üretir. Admin mobil, sahada hızlı doğrulama/geri bildirim verir; web panel operasyonel filtreleme ve toplu takip sağlar. Çakışma önleme: sunucu tarafı durum makineleri ve versiyonlama ile aynı kayda eşzamanlı değişiklikler güvenli yönetilir.
- Mantıksal Mimari Diyagramı
- Aday Mobil (React Native)
- Admin Mobil (React Native)
- Mevcut Admin Web (Var olan panel)
- Ortak Backend API
- Auth • Form • Belge • Mesaj Doğrulama • Audit Log
- Ortak DB (PostgreSQL vb.(Kullanılan db hangi türdeyse))
- Kritik ilke: Mobil ve Web aynı “application/document/message” kayıtlarını tüketir. Sonuç: Adminin gördüğü liste (mobil) = panelde görülen liste (web) = DB gerçeği.

Notes:

Koordineli yapı: Mobil aday + mobil admin + mevcut web panelin aynı backend/DB ile çalışması; tutarlılık ve tek doğruluk kaynağı vurgulanır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 6: Uçtan Uca Kullanıcı Akışı

- Akışın Adımları
- 1) Kayıt: Aday hesap oluşturur; temel iletişim bilgileri server’da doğrulanır ve user kaydı açılır. 2) Katılım bilgilendirmesi: Seçilen programa göre adımlar ve gerekli belgeler checklist olarak gösterilir. 3) Kişisel bilgiler: Aday formu tamamlar; veri server’a iletilir, DB’de application kaydı oluşur (taslak → gönderildi). 4) Belge tarama/yükleme: Kamera ile belge görüntüsü alınır; kalite kontrol + gerekirse veri okuma; server’a yüklenir. 5) Durum üretimi: Sunucu parse/doğrulama çalıştırır; belge statüsü (OK/EKSİK/YANLIŞ FORMAT/OKUNMADI) DB’ye yazılır. 6) Admin listesi: Admin mobil ve web panel başvuruyu aynı listede görür; doğrular veya düzeltme ister. 7) Mesajlaşma: Eksik veya hata varsa admin, adaya kayıtlı mesaj gönderir; aday düzelterek yeniden yükler.
- Akış Diyagramı (Aday → Sunucu/DB → Admin)
- 1. Kayıt Formu
- user oluştur server doğrula DB: users
- 2. Katılım Bilgilendirme
- adımlar + checklist DB: program_checklists
- 3. Başvuru & Kişisel Veri
- application oluştur DB: applications
- 4. Belge Tarama/Yükleme
- kamera + kalite DB: documents
- 5. Admin Doğrulama
- mobil/web aynı kayıt DB: audit_log
- 6. Mesajlaşma
- kayıtlı iletişim DB: messages

Notes:

Uçtan uca akış: Her adımın server/DB tarafında bir kayda dönüşmesi ve adminin mobil/web üzerinden aynı kaydı görmesi vurgulanır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 7: Modül 1 — Kayıt Formu

- İçerik ve Problem Alanı
- Alan örnekleri: ad-soyad, e‑posta, telefon, ülke/şehir, kullanıcı sözleşmesi & KVKK açık rıza onayı. Tipik kullanıcı hataları: yanlış e‑posta formatı, hatalı telefon, geçersiz karakter, onay kutularını atlama. Tipik sistem sorunları: aynı e‑posta ile tekrar kayıt denemesi, OTP gecikmesi, zayıf parola. Uygulama çözümü: alan bazlı anlık doğrulama + açıklayıcı hata metni + maskeleme (telefon) + parola gücü göstergesi. Sunucu/DB: kayıt isteği alındığında server tarafı validasyon + unique kontrol; DB’de users tablosuna yazım. Doğrulama: OTP / e‑posta doğrulaması sonrası user.status = VERIFIED yapılır; audit_log kaydı oluşur.
- Problem / Senaryo
- Aday yanlış e‑posta/telefon girer → admin iletişim kuramaz → süreç kilitlenir. Tekrarlı kayıt denemeleri → DB’de mükerrer kullanıcı riski. Onay kutusu (KVKK/aydınlatma) atlanırsa veri işleme hukuki risk oluşturur.
- Çözüm (Uygulama + Sunucu/DB)
- Mobilde anlık doğrulama + server’da tekrar doğrulama (çift katman). DB’de unique index: email/phone; server idempotency ile aynı isteği tekrar yazmaz. KVKK onayı: consent_version + timestamp DB’ye kaydedilir; audit_log ile izlenir.
- Teknik Akış (Kayıt)
- Mobil (Aday)
- Form doldur Anlık validasyon
- Backend API
- Validasyon OTP / rate limit
- DB: users
- insert/update unique kontrol
- Audit Log
- REGISTER VERIFY event

Notes:

Kayıt modülü: kullanıcı hataları ve nedenleri + mobilde önleyici doğrulama + server/DB katmanında kesin doğrulama ve kayıt altına alma anlatılır. [Sources] - KVKK (6698) resmi bilgi portalı: https://www.kvkk.gov.tr/ - KVKK Kanun Metni (Mevzuat): https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf

## Slide 8: Modül 2 — “Eğitim Formu” (Katılım Bilgilendirmesi)

- Bu Modül Ne Yapar?
- Amaç: Adayın programa katılım için gereken adımları ve belgeleri “yanlış anlamasını” en başta azaltmak. İçerik: program seçimi → adım adım süreç → gerekli belgeler → format örnekleri → teslim son tarihleri. Checklist: belge bazında “var/yok/yeniden çek” durumları; çok sayfalı belge desteği. Sık hatalar: yanlış belge türü, eksik sayfa, okunmayan görsel, yanlış isimlendirme, tarih/kimlik uyumsuzluğu. Sunucu/DB: checklist şablonu program bazında DB’den gelir (admin/süper admin yönetebilir); adayın ilerlemesi DB’ye yazılır. Kritik çıktı: “Ben yaptım” değil; server’da “tamamlandı/eksik” statüleri ile kayıtlanmış ilerleme.
- Örnek Checklist (Program A)
- Belge
- Beklenen Format
- Durum
- Kimlik
- JPG/PDF, net
- EKSİK
- Başvuru Formu
- PDF, imzalı
- OK
- Ek Belge
- QR/Barcode varsa
- OKUNMADI
- Problem / Senaryo
- Aday “hangi belge gerekli?” sorusunu yanlış anlar → eksik gönderir. Belge tesliminde “format” bilinmez → okunamaz/yanlış dosya yüklenir. Süreç adımları net değil → aday yanlış sırada ilerler, tekrar döner.
- Çözüm (Uygulama + Sunucu/DB)
- Program bazlı adım+checklist, uygulamada açıkça gösterilir; örnek görsel/format ipuçları sunulur. Aday ilerlemesi ve checklist durumları server’a yazılır; admin her an güncel tabloyu görür. Belge durumları standartlaştırılır; “eksik/hatalı” sebepleri mesaj şablonlarıyla hızlı bildirilir.

Notes:

Bu slayt “Eğitim Formu”nun eğitim içeriği olmadığını; katılım bilgilendirmesi + checklist + sık hata önleme olduğunu netleştirir. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 9: Modül 3 — Kişisel Bilgi Transferi (Server/DB)

- Problemler, Nedenler, Çözümler
- Amaç: Adayın paylaştığı kişisel bilgilerin güvenli, bütünlüklü ve izlenebilir biçimde server’a aktarılması. Tipik problemler: bağlantı kopması, uygulamanın kapanması, aynı formun tekrar gönderilmesi, cihaz saat farkı. Kullanıcı hataları: alanları boş bırakma, yanlış tarih, farklı belgelerle tutarsız bilgi (isim/kimlik uyuşmazlığı). Uygulama çözümü: “taslak kaydet” + adım adım ilerleme + zorunlu alan kontrolü + tutarlılık uyarıları. Sunucu/DB çözümü: doğrulama kuralları + idempotency key + versiyonlama; DB’de applications kayıtları ve durum geçişleri. KVKK uyumu: asgari veri prensibi, amaçla sınırlılık, erişim yetkisi, saklama süresi; audit log ile kanıtlanabilirlik.
- Problem / Senaryo
- Zayıf bağlantıda form gönderimi yarıda kalır → kullanıcı “gitti mi?” bilemez. Aynı form iki kez gönderilir → mükerrer kayıt/çakışan durum. Belge ile form bilgisi uyuşmaz → manuel düzeltme gerekir.
- Çözüm (Uygulama + Sunucu/DB)
- Mobil “taslak” modunda local kuyruğa alır; online olunca otomatik gönderir. Sunucu idempotency ile aynı request’i tek kayda indirger; DB unique/versiyon kontrol. Sunucu doğrulama kuralları: uyuşmazlık halinde status=NEEDS_REVIEW + admin uyarısı.

Notes:

Kişisel veri aktarımı: offline/online tutarlılık, idempotency ve KVKK ilkeleri üzerinden “server’a iletme + DB’ye kaydetme” hedefi teknikleştirilir. [Sources] - KVKK (6698) resmi bilgi portalı: https://www.kvkk.gov.tr/ - OWASP MASVS (mobil uygulama güvenliği referansı): https://mas.owasp.org/

## Slide 10: Modül 4 — Mesajlaşma (Aday ↔ Admin)

- Neden Mesajlaşma Modülü?
- İhtiyaç: Dağınık iletişim yerine tek kanallı, kayıtlı ve başvuruya bağlı mesajlaşma. Temel senaryolar: “Eksik belge var”, “Belge okunmuyor”, “Yanlış format”, “Düzeltip tekrar yükleyin”. Kullanıcı hataları: mesajı görmeme, yanlış belgeyi tekrar gönderme, eski mesajı referans alamama. Uygulama çözümü: başvuru bazlı mesaj thread’i, okunma durumu, şablon mesajlar, belge linki ile bağlama. Sunucu/DB: messages tablosu + attachments referansı; mesaj gönderme/okuma event’leri audit log’a yazılır. Admin mobil/web: aynı thread görünür; admin webden yazsa mobilde görülür (ve tersi).
- Örnek Mesaj Senaryoları
- Eksik belge bildirimi
- “Kimlik belgesi eksik. Checklist’te işaretli alanı tamamlayıp yeniden yükleyiniz.”
- Okunmayan belge uyarısı
- “Yüklenen görsel bulanık; lütfen tekrar çekin (OKUNMADI).”
- Yanlış format
- “PDF yerine fotoğraf yüklenmiş; beklenen format: PDF (YANLIŞ FORMAT).”
- Problem / Senaryo
- Admin e‑posta/WhatsApp gibi dış kanallardan yazarsa kayıt kaybolur; web/mobilde izlenemez. Aday hangi belgeye yönelik mesaj olduğunu anlamaz; yanlış dosyayı yeniden gönderir.
- Çözüm (Uygulama + Sunucu/DB)
- Mesajlar başvuruya ve belgeye bağlanır; her mesaj DB’de kalıcıdır ve audit log’a düşer. Mesaj şablonları, belge statüsü ile otomatik önerilir (OKUNMADI/EKSİK/YANLIŞ FORMAT).

Notes:

Mesajlaşma modülü: iletişimi kayıt altına alır; mobil+web aynı thread’i görür; admin süreç hızlandırır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 11: Modül 5 — Kamera ile Belge Tarama / Yükleme

- Özelliğin İş Mantığı
- Kapsam: Kamera ile belge görüntüsü almak, gerektiğinde QR/Barcode veya metin alanlarını okumaya çalışmak ve server’a göndermek. Belge çeşitliliği: kimlik, form, onay yazısı, davetiye, bilet/boarding pass, sertifika vb. Tipik kullanıcı hataları: karanlık/bulanık çekim, kadraj dışı, yanlış belge seçimi, eksik sayfa, mükerrer yükleme. Uygulama çözümü: çekim önizleme, kalite kontrol (bulanıklık/ışık), belge tipi seçimi, çoklu sayfa yükleme. Sunucu/DB: dosya yükü storage’a alınır; documents kaydı açılır; parse/doğrulama sonucu status alanına yazılır. Admin görünürlüğü: admin mobil ve web panelde aynı belgeyi görür; gerekirse “yeniden yükle” talebi mesajlaşma ile gider.
- Teknik Akış (Tarama → Server → DB)
- 1) Belge tipi seç kimlik / form / bilet vb.
- 4) Upload multipart + retry
- 2) Kamera çekimi kılavuz + önizleme
- 5) Sunucu doğrulama parse + alan kontrol
- 3) Kalite kontrol bulanıklık/ışık kontrolü
- 6) DB kaydı documents.status güncelle
- Problem / Senaryo
- Belge tarama “tek bir belgeye” indirgenirse, diğer belgelerdeki eksik/hata görünmez. Mobilde çekilen görselin server’da işlenmesi/DB’ye kaydı net değilse admin listesi oluşmaz.
- Çözüm (Uygulama + Sunucu/DB)
- Belge tipi kavramı geniş tutulur; checklist program bazında belge setini tanımlar (DB’den). Upload sonrası server parse/doğrulama çalıştırır; status DB’de güncellenir; admin listesi buradan oluşur.

Notes:

Belge tarama modülü: farklı belge türleri için aynı altyapı; çekim kalitesi ve server tarafı doğrulama ile DB’ye kayıt altına alma vurgulanır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 12: Belge Eksikleri & Doğrulama Mantığı

- Doğrulama Neden Bir “Durum Makinesi”dir?
- Her belge kaydı DB’de tekil bir document satırıdır: tür, dosya referansı, parse sonucu, doğrulayan admin, zaman damgası. Doğrulama iki aşamalı: (1) otomatik sunucu doğrulaması (format/parse) (2) admin doğrulaması (iş kuralı/uygunluk). Statü yönetimi başvurunun genel durumunu belirler: application.status = IN_REVIEW / NEEDS_FIX / APPROVED. Hata kodu ve açıklama saklanır: kullanıcıya net geri bildirim, admin için hızlı karar. Server kaydı kritik: “Fotoğraf yüklendi” yerine “okundu/okunmadı/eksik alan” gibi anlamlı sonuçlar DB’de durur. Admin mobil ve web, aynı statüyü gösterir; değişiklikler audit_log ile izlenir.
- Belge Statüleri — Beklenen Sistem Tepkisi
- Statü
- Ne demek?
- Sistem aksiyonu
- OK
- Okunur + format uygun
- Admin onayına hazır; application ilerler
- EKSİK
- Belge yok / eksik sayfa
- Checklist uyarısı; yeniden yükle iste
- YANLIŞ FORMAT
- PDF/JPG beklenirken farklı
- Adaya format açıklaması + örnek göster
- OKUNMADI
- Bulanık/karanlık/QR okunamadı
- Yeniden çek uyarısı + kalite kontrol
- Zorunlu Senaryolar (Problem → Çözüm)
- • Bulanık/karanlık
- → Önizleme + yeniden çek + kalite kontrol → status=OKUNMADI
- • Yanlış belge türü
- → Belge tipi seçimi + örnek görsel + admin doğrulaması
- • Eksik sayfa/alan
- → Checklist uyarısı + çoklu sayfa → status=EKSİK
- • QR/Barcode okunamadı
- → Çerçeve/kılavuz + tekrar dene + server parse doğrulama
- • Mükerrer gönderim
- → Buton kilitleme + sunucuda idempotency/unique kontrol

Notes:

Belge doğrulama mantığı: statüler ve zorunlu problem→çözüm senaryoları; her sonuç server’da üretilip DB’ye yazılır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 13: Admin Mobil (Liste + Doğrulama + Mesaj)

- Ekranlar ve Davranışlar
- Ana ekran: “Başvurular” listesi (filtre: durum, program, tarih, eksik belge var/yok). Detay ekranı: aday bilgisi + başvuru durumu + belge listesi + mesaj thread’i. Belge görüntüleme: yüklenen dosyayı açma, zoom, sayfa sayfa inceleme; statü güncelleme. Doğrulama aksiyonları: OK / EKSİK / YANLIŞ FORMAT / OKUNMADI seçimi + açıklama notu. Hızlı mesaj: seçilen belge statüsüne göre otomatik şablon; adaydan “yeniden yükle” talebi. Sunucu/DB: admin aksiyonları server’a gider, DB’de documents.status + applications.status güncellenir; audit_log kaydı düşer.
- Örnek Navigasyon (Wireframe)
- 1) Liste
- Filtre + rozetler (NEEDS_FIX/IN_REVIEW)
- 2) Başvuru Detayı
- Belge listesi + durumlar Mesaj sekmesi
- 3) Doğrulama
- Statü seç + not Kaydet → server/DB

Notes:

Admin mobil: liste/doğrulama/mesaj ekranları; her admin aksiyonu server üzerinden DB’ye yazılır ve web panelde aynı anda görünür. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 14: Admin Web Panel (Mevcut) — Mobil ile Tam Senkron

- Web’in Rolü (Kapsam İçinde)
- Web panel zaten var: Bu proje web’i yeniden yazmaz; mobil tarafı geliştirirken web ile aynı backend/DB üzerinden çalışır. Web güçlü yanları: gelişmiş filtreleme/sıralama, toplu inceleme, operasyonel raporlama (kapsam: liste + doğrulama). Senkron mantığı: admin webde belgeyi “OK” yaparsa, admin mobil listesinde aynı statü anında görünür. Çakışma yönetimi: aynı belge iki admin tarafından farklı anda değiştirilecekse server “son yazan + versiyon kontrol” uygular. Kayıt bütünlüğü: web/mobil fark etmeksizin her doğrulama audit_log’a yazılır (kim, ne, ne zaman). Mesajlaşma webde de görünür: adayla yapılan iletişim kayıtlı olduğundan denetlenebilirlik artar.
- Problem / Senaryo
- Mobil ayrı bir veri kaynağı kullanırsa webde farklı listeler oluşur; admin “hangi liste doğru?” sorar. Webde doğrulanan belgenin mobilde görünmemesi, sahada yanlış karar riskini artırır.
- Çözüm (Uygulama + Sunucu/DB)
- Ortak backend + ortak DB: web ve mobil aynı endpoint’leri tüketir; listeler aynı sorgulardan oluşur. Sunucu tarafı olay günlüğü (audit log) ve versiyonlama, senkronu güvenli hale getirir.

Notes:

Admin web panel: mevcut sistemin mobil ile senkronu; amaç çift kaynaklı veri ve tutarsız listeleri engellemek. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 15: Veri Modeli (Özet)

- Neden Bu 5 Tablo?
- Model prensibi: her ekranın okuduğu/verdiği bilgi DB’de açık bir karşılığa sahip olmalı. users: kimlik/iletişim + doğrulama durumları + KVKK onay sürümü. applications: program seçimi + aday beyanları + başvuru durumu + güncelleme tarihleri. documents: belge türü + dosya referansı + parse sonucu + statü + doğrulayan admin. messages: başvuruya bağlı mesaj thread’i + okunma durumu + (opsiyonel) belge referansı. audit_log: kritik aksiyonların değişmez kayıtları (REGISTER, SUBMIT, UPLOAD, VERIFY, MESSAGE).
- Tablolar ve Kritik Alanlar
- Tablo
- Örnek Alanlar (kısa)
- users
- id, name, email, phone, status, consent_version, created_at
- applications
- id, user_id, program_id, status, payload_json, submitted_at
- documents
- id, application_id, type, file_url, status, parse_result, verified_by
- messages
- id, application_id, sender_role, body, read_at, related_document_id
- audit_log
- id, actor_role, actor_id, action, entity_type/id, timestamp, diff

Notes:

Veri modeli: 5 temel tablo ile tüm modüller server/DB tarafında izlenebilir ve admin mobil/web tarafından ortak tüketilebilir hale getirilir. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 16: API Sözleşmesi (Mobil + Web Ortak Endpoint Mantığı)

- Sözleşme Prensipleri
- İlke: Mobil (aday/admin) ve web panel; aynı REST endpointlerini / aynı auth mekanizmasını kullanır. Her kritik çağrı idempotent tasarlanır (özellikle belge upload ve form submit). Sunucu her istekte validasyon yapar; istemci doğrulaması tek başına yeterli değildir. Yanıtlar statü odaklıdır: application.status, document.status, message.readAt gibi alanlar UI’ı doğrudan besler. Hata yönetimi: kullanıcıya gösterilecek hata mesajları için standart error_code + error_detail yapısı.
- Örnek Endpoint Seti
- Metot
- Endpoint
- DB Etkisi
- POST
- /auth/register
- users insert + audit_log
- /applications
- applications insert/update
- GET
- /applications?filters
- listeleme (admin mobil/web)
- /documents/upload
- documents insert + storage + parse job
- PATCH
- /documents/{id}/status
- documents.status + audit_log
- /messages?applicationId
- messages read
- /messages
- messages insert + audit_log
- Teknik Akış (Ortak Endpoint)
- Mobil/Web → (Auth token) → API Gateway/Backend → (validasyon) → DB Aynı endpoint = aynı iş kuralı = aynı kayıt.

Notes:

API sözleşmesi: mobil ve webin aynı endpointleri kullanması, senkronun teknik garantisidir; idempotency ile mükerrer kayıtlar engellenir. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)

## Slide 17: Güvenlik/KVKK + Loglama

- Zorunlu Güvenlik Kontrolleri
- KVKK perspektifi: kişisel veriyi amaçla sınırlı toplama, açık rıza/aydınlatma, erişim yetkisi ve saklama süresi yönetimi. İletim güvenliği: tüm trafik TLS; token tabanlı kimlik doğrulama; rol bazlı yetkilendirme (Aday/Admin/Süper Admin). Depolama güvenliği: belgeler için erişim kontrollü URL (kısa ömürlü) + sunucuda dosya doğrulama (MIME/type). Loglama: audit_log tablosu ile REGISTER/SUBMIT/UPLOAD/VERIFY/MESSAGE olayları değişmez kayda yazılır. İzlenebilirlik: “hangi admin hangi belgeyi hangi statüye çekti?” ve “aday hangi tarihte yeniden yükledi?” netleşir. Suiistimal önleme: rate limit, brute force koruması, anomali izleme (mükerrer upload/çok hızlı deneme).
- Audit Log (Örnek Kayıt)
- [2026-01-21 10:12] USER_REGISTERED user#102 [2026-01-21 10:20] APPLICATION_SUBMITTED app#555 [2026-01-21 10:22] DOCUMENT_UPLOADED doc#901 type=ID [2026-01-21 10:23] DOCUMENT_PARSED doc#901 status=OK [2026-01-21 10:40] ADMIN_VERIFIED doc#901 status=OK admin#12 [2026-01-21 10:41] MESSAGE_SENT app#555 from=ADMIN

Notes:

Güvenlik ve KVKK: veri iletimi, depolama, erişim kontrolü ve audit log ile izlenebilirlik anlatılır. [Sources] - KVKK (6698) resmi bilgi portalı: https://www.kvkk.gov.tr/ - OWASP MASVS (mobil güvenlik doğrulama standardı): https://mas.owasp.org/

## Slide 18: MVP Teslim Çıktıları (Mobil Odaklı)

- Teslim Edilecek Fonksiyonlar
- Aday Mobil (React Native): Kayıt formu + katılım bilgilendirme/checklist + kişisel bilgi formu + mesajlaşma + belge tarama/yükleme. Admin Mobil (React Native): başvuru listesi + filtreleme + belge görüntüleme + statü doğrulama + hızlı mesaj. Ortak Backend entegrasyonu: mobil, mevcut web ile aynı endpoint’leri kullanır; DB tekil kayıt üretir. Belge tarama senaryoları: bulanıklık/karanlık, yanlış belge türü, eksik sayfa, QR okunamadı, mükerrer gönderim → hepsi uygulama+sunucu tarafında yönetilir. Veri modeli & audit log: users/applications/documents/messages/audit_log tabloları ile izlenebilir akış. Test kapsamı: form validasyon, offline retry, upload idempotency, admin doğrulama tutarlılığı (mobil↔web). Kabul kriteri: admin mobilde görülen liste = web panelde görülen liste; her aksiyon DB ve audit log’da izlenebilir.
- MVP Tanımı
- • Her modül DB’de kayıt üretir (form/belge/mesaj). • Admin doğrulaması audit_log ile kanıtlanır. • Mobil ve web aynı başvuruyu aynı statüyle gösterir. • Belge eksikleri “durum” olarak görünür; aday mesajla yönlendirilir. • Belge tarama kalite kontrolü çalışır; OKUNMADI senaryosu işletilir. • Mükerrer upload engellenir (idempotency + UI kilidi).
- İletişim: Ahmet Tunahan Yalçın : ytunahan7878@gmail.com Ural Altan Bozkurt : uralaltan10@gmail.com

Notes:

MVP: mobil teslimat odaklıdır; mevcut web panel ile ortak backend/DB üzerinden senkron çalıştığı kabul kriteri olarak tanımlanır. [Sources] - (Bu slayt, proje varsayımları ve sistem tasarımı anlatımıdır; dış kaynak kullanılmadı.)
