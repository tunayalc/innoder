# Natro Canli Ortam Kurulumu

Bu proje paylasimli hosting paketi icin degil, root erisimli Natro XCloud VPS icin hazirlanmistir. Baslangic sunucusu olarak 2 vCPU, 4 GB RAM ve 60 GB SSD sinifini kullanin. Panel lisansi (Plesk/cPanel/CyberPanel) gerekli degildir.

## Satin Alma ve DNS

1. Natro'dan XCloud Medium veya en az `2 vCPU / 4 GB RAM / 60 GB SSD` bir VPS alin.
2. Mevcut en guncel Ubuntu LTS surumunu secin. Mumkunse Ubuntu 24.04, en az Ubuntu 22.04 kullanin.
3. Natro'nun verdigi sunucu IPv4 adresine iki A kaydi yonlendirin:

   ```text
   api.innoder.org    A    SUNUCU_IP
   admin.innoder.org  A    SUNUCU_IP
   ```

Mobil release paketi `api.innoder.org` adresini kullanir. Mevcut `innoder.org` ve `www.innoder.org` web sitesi kayitlari degistirilmez.

## Tek Komutluk Kurulum

GitHub'daki `main` dali guncelse repoyu Natro sunucusuna alip kurucuyu calistirin:

```sh
sudo apt-get update && sudo apt-get install -y git
sudo git clone https://github.com/uralaltan/inno-association-mobile.git /opt/inno-association-mobile
cd /opt/inno-association-mobile
sudo bash deploy/natro/setup.sh
```

GitHub'a push beklemeden hazir Natro arsivini kullanmak icin bilgisayardan:

```sh
scp inno-natro-ready-20260711.tar.gz root@SUNUCU_IP:/opt/
ssh root@SUNUCU_IP
cd /opt && tar -xzf inno-natro-ready-20260711.tar.gz
cd /opt/inno-association-mobile
bash deploy/natro/setup.sh
```

Arsiv kurulumu Git gecmisi tasimaz; bu nedenle sonraki surumler yeni arsiv yuklenerek guncellenir. `innoctl update` komutu GitHub'dan klonlanan kurulumlarda kullanilir.

Kurucu su islemleri otomatik yapar:

- Docker Engine ve Compose kurulumu
- SSH portunu koruyan UFW kurallari, Fail2ban, 80/443 erisimi
- PostgreSQL/JWT/yedekleme icin rastgele guclu anahtarlar
- `.env` ve bos `rclone.conf` dosyasini `600` izinle olusturma
- DNS kaydi kontrolu ve Caddy ile otomatik Let's Encrypt TLS
- PostgreSQL migrasyonu ve tum servislerin baslatilmasi
- Ilk super admin ve tek kullanimlik gecici sifre
- Gunluk sifreli yedek, servis/disk/yedek izleme

DNS kayitlari henuz yayilmadiysa kurucu gerekli iki kaydi ve sunucu IP'sini yazip durur. Kayitlar yayildiktan sonra ayni komutu tekrar calistirin; uretilen anahtarlar degismez.

SMTP bilgisi bilinmiyorsa kurulumda `-` girilebilir, ancak unutulan sifre e-postasi SMTP tamamlanana kadar calismaz. Canli kayit acilmadan once bu eksik kapatilmalidir.

Super admin parolasi kurulum sirasinda gorunmeden girilebilir veya bos birakilarak guclu bir deger uretilir. Parola kaynak koda yazilmaz, veritabaninda Argon2id hash olarak saklanir ve ilk giriste degistirilmesi zorunludur.

## Gunluk Operasyon

Kurulumdan sonra sunucunun her yerinden su komutlar kullanilir:

```sh
innoctl status
innoctl check
innoctl logs server
innoctl backup
innoctl backups
innoctl update
innoctl admin-reset
```

Geri yukleme bilincli olarak `--yes` ister ve once mevcut sistemin yeni yedegini alir:

```sh
innoctl restore inno-20260101T030000Z.tar.gz.enc --yes
```

`innoctl update` yerel degisiklik varsa durur; yalniz `main` dalini fast-forward ceker ve asagidaki yayin islemini calistirir. Arsivle aktarilan, Git icermeyen kurulumlarda yeni kaynaklar yuklendikten sonra `innoctl release` kullanilir.

Yayin islemi sifreli yedek alir, mevcut API/web imajlarini geri donus etiketleriyle saklar, yeni imajlari derler ve eklemeli migrasyonlari uygular. Once API, sonra web saglik kontroluyla baslatilir. Hata halinde onceki API/web imajlari otomatik geri yuklenir; eklemeli veritabani migrasyonlari korunur. Geri donus Compose dosyasi `deploy/releases/rollback-TIMESTAMP.yml` altindadir. Bu otomasyon ilk kurulum yerine kullanilmaz ve geriye uyumsuz/destructive bir migrasyonla kullanilmamalidir.

Aktivasyondan once `dist/scripts/checkRuntime.js` gercek JPEG/PNG piksel cozumlemesini yeni API imajinda dener; CPU/modul uyumsuzlugunda eski konteynerler degistirilmez. 19 Ekim 2026 yayininda ilk CPU uyumsuzlugu otomatik geri donusle korundu, tasinabilir goruntu dogrulayicisiyla giderildi ve son yayin HTTPS kontrollerini gecti. Yayin oncesi/sonrasi sifreli yedekler agi kapali, uretim veri volumu baglanmayan gecici PostgreSQL konteynerinde geri yuklendi. `verify-backup.sh` yalniz bu tur silinebilir test konteynerlerinde `ISOLATED_RESTORE_CHECK=1` ile kullanilmalidir; uretim veritabaninda calistirilmaz.

`release` betiginin soz dizimi ve eski API yazim uyumlulugu yerel olarak test edildi; gercek Natro yayini ve bos sunucuya geri yukleme ayrica kabul edilmelidir. Bir yedegin uretilmesi, geri yukleme provasinin basarili oldugunu kanitlamaz. Uzak yedek/SMTP/alarm eksikleri yalniz uyari olarak yazilir; bu uyariyla kurulan sistem canli kabulden gecmis sayilmaz.

## Uzak Yedek ve Alarm

Natro snapshot ek korumadir fakat sunucudan bagimsiz yedek yerine gecmez. Bir S3/Google Drive/uzak sunucu hedefini `rclone config` ile hazirlayin, dosyayi `deploy/rclone.conf` konumuna koyun ve `deploy/.env` icinde `RCLONE_REMOTE` degerini ayarlayin. Her basarili uzak kopya ayrica izlenir.

Proje bazli kan grubu kaydi yalniz API'ye verilen, base64 kodlanmis 32 baytlik
ayri `ESC_BLOOD_GROUP_KEY` anahtariyla acilabilir. Kurumun saglik verisi
isleme onayi ve korumalari tamamlanana kadar anahtar ve proje secenegi kapali
kalir. Anahtari kaynak koda, yedege veya ortak konteyner ortamlarina koymayin.
PostgreSQL yedekleri bu tablonun semasini icerir ancak saglik kayitlarini
icermez. Bir geri yuklemeden sonra gerekliyse yeni acik riza alin. Saglayici
disk snapshot'i ayridir: eski riza kayitlari temizlenmeden trafigi acmayin.

`ALERT_WEBHOOK_URL` Slack/Teams uyumlu bir webhook ile doldurulursa API kesintisi, 26 saati gecen yedek ve `%80` disk kullanimi otomatik bildirilir.

## Canli Kabul Kontrolu

Kayit ekranini acmadan once:

```sh
innoctl check
innoctl backup
npm run check:all
```

Admin panelinde giris, gecici sifre degistirme, bir PDF yukleme/indirme, CSV/ZIP disari aktarimi ve bir yedekten geri donus senaryosu elle de dogrulanmalidir. Android keystore, Apple dagitim sertifikalari ve hukuk onayli KVKK metni sunucu kurulumundan ayri yayin gereksinimleridir.
### Portal entry points

Share `https://admin.innoder.org/uye` directly with members and
`https://admin.innoder.org/admin` with staff. The old root address still serves
the admin sign-in. Neither portal links to the other. The public association site,
DNS and mobile API do not need any changes. These are unlisted, non-indexed
entry points, **not secret invitation tokens**. Authentication, account approval,
server role checks and application ownership enforce access.

