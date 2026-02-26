# PROJECT_MEMORY

## 0) TL;DR (En guncel durum)

* Su an ne yapiyoruz?: Aday kayit akisini sifresiz/pending modele cevirdik.
* Son degisiklik neydi?: `Register` yeniden eklendi; kayitlar KVKK + ad-soyad + e-posta ile alinip beklemeye dusuyor.
* Bir sonraki net adim ne?: Admin tarafinda PNR dogrulama sonrasi giris bilgisi uretme/paylasma akisini baglamak.

## 1) Proje Amaci ve Kapsam

* Amac: Inno Dernegi aday ve admin sureclerini mobil uygulama ile yonetmek (bilgilendirme, basvuru, belge, dogrulama).
* Kapsam ici: Aday onboarding/auth, basvuru akisi, belge yukleme/dogrulama, admin inceleme.
* Kapsam disi: Gercek ERP/PNR sistem entegrasyonu (simdilik mock odakli).

## 2) Non-negotiables / Kirmizi Cizgiler

* KVKK onayi olmadan kayit alinmaz.
* Yetkisiz kullanici adayi admin paneline ulasamaz.
* Mock backend, urun davranisini gercekci sekilde taklit etmeli.

## 3) Mimari Ozet

* Bilesenler: React Native ekranlari + Redux store + backend adapter (mock/remote).
* Veri akisi: Screen -> thunk -> backend interface -> mock/remote implementasyonu -> store guncelleme.
* Onemli dizinler/moduller:
  * `src/screens/auth`
  * `src/store/thunks`
  * `src/services/backend`
  * `src/navigation`

## 4) Konvansiyonlar ve Standartlar

* Kod stili / lint / format: ESLint + TypeScript (`npm run lint`, `npm run typecheck`).
* Branch/commit yaklasimi: main tabanli, degisiklikler kucuk ve testli.
* Isimlendirme/klasor duzeni: feature bazli ekran/modul ayrimi korunuyor.

## 5) Kurulum & Calistirma

* Gereksinimler: Node >= 20, RN Android toolchain (SDK/adb/emulator).
* Komutlar:
  * `npm install`
  * `npm start`
  * `npm run android`
  * `npm run typecheck`
  * `npm run lint`
* Ortam degiskenleri (sadece ISIMLER): `ANDROID_HOME`, `JAVA_HOME`.
* Lokal gelistirme notlari: Varsayilan veri kaynagi `mock` (`src/config/appConfig.ts`).

## 6) Decision Log (append-only)

* 2026-02-26 — Karar: Aday kayit akisi sifresiz olacak ve kayit sonrasi otomatik giris kapatilacak | Gerekce: Sadece PNR dogrulamasi gecen katilimcilara giris bilgisi verilmesi gerekiyor | Etki: `RegisterScreen`, auth thunklari, mock backend login/register kurallari, navigation auth rotalari | Alternatifler: Sifreli kayit + soft-block (reddedildi)

## 7) Milestones / Donum Noktalari (append-only)

* 2026-02-12 — Milestone: Europass CV + motivasyon + onboarding video ve medya entegrasyonlari | Sonuc: Aday akisinda uretim artisi
* 2026-02-26 — Milestone: Sifresiz kayit + pending verification auth modeli | Sonuc: Kayit ve giris ayrimi netlestirildi

## 8) Yapilanlar

* [x] `Register` rotasi tekrar auth stack'e eklendi.
* [x] Kayit formu ad-soyad + e-posta + KVKK modeline indirildi.
* [x] Kayit sonrasi otomatik login kaldirildi.
* [x] Mock backend'de kayitli kullanici durumu `pending_verification` olarak kaydediliyor.
* [x] `pending_verification` kullanicilarin candidate login'i engelleniyor.

## 9) Yapilacaklar (Next)

* [ ] PNR dogrulama sonrasi hesap aktivasyonu/giris bilgisi olusturma akisini admin tarafina ekle.
* [ ] E-posta gonderimi (giris bilgisi iletimi) entegrasyonu ekle.
* [ ] Admin tarafinda pending kayitli kullanicilari listeleyen ekran/filtre ekle.

## 10) Bilinen Sorunlar / Teknik Borc / Riskler

* `npm run lint` su an projede bu degisiklik disinda da mevcut hatalar veriyor (aday ekranlarinda unused vars).
* Remote backend register endpointi sifresiz modele backend tarafinda henuz uyumlu olmayabilir.

## 11) Notlar ve Tuzaklar (Pitfalls)

* Auth davranisi mock'ta degistiginde test dosyalari da guncellenmeli (`mockBackend.test.ts`).
* `RootStackParamList` ve `RootNavigator` birlikte guncellenmeden yeni auth rotasi calismaz.

### Guncelleme Kaydi

* Son guncelleme: 2026-02-26
