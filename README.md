# Inno Association Başvuru Sistemi

Bu depo üç üretim bileşenini içerir:

- React Native aday ve mobil admin uygulaması
- `server/` TypeScript API, PostgreSQL migrasyonları ve özel belge depolaması
- `admin-web/` masaüstü odaklı web yönetim paneli

## Yerel Geliştirme

Mobil uygulama geliştirme derlemelerinde mock backend kullanır; release derlemelerinde gerçek API otomatik olarak etkinleşir.

```sh
npm ci
npm run typecheck
npm test -- --runInBand
```

API için PostgreSQL oluşturup `server/.env.example` dosyasındaki değerlerle bir `server/.env` hazırlayın:

```sh
npm --prefix server ci
npm --prefix server run migrate
npm --prefix server run dev
```

Web admin paneli:

```sh
npm --prefix admin-web ci
npm --prefix admin-web run dev
```

## Uretim

Natro XCloud kurulumu tek komutluk kurucuya baglanmistir:

```sh
sudo bash deploy/natro/setup.sh
```

TLS, Docker Compose, sifreli gunluk yedek, bagimsiz yedek hedefi, `innoctl` operasyonlari ve geri yukleme adimlari `deploy/README.md` icinde yer alir. Canli ortamda `.env`, Android keystore, Apple sertifikalari ve yedek sifresi repoya eklenmez.

İlk yayın öncesinde şu komut eksiksiz geçmelidir:

```sh
npm run check:all
```

Android üretim imzası için `android/keystore.properties.example` örneğini kullanın. iOS dağıtımı Xcode üzerinde kurumun Apple Developer takımı ve App Store profiliyle imzalanmalıdır.
