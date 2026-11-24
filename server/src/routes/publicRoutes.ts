import type { FastifyInstance } from 'fastify';

const page = (title: string, body: string) => `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | inno derneği</title><style>
:root{color-scheme:light dark;--bg:#f6f7f8;--surface:#fff;--text:#20272c;--muted:#606c75;--link:#006789;--border:#dce1e4;--outline:#7c858b}
@media(prefers-color-scheme:dark){:root{--bg:#17191b;--surface:#202326;--text:#f2f4f5;--muted:#abb6be;--link:#86d3ec;--border:#3a4146;--outline:#89949b}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,sans-serif;letter-spacing:0}main{max-width:760px;margin:auto;padding:48px 22px 80px}h1{font-size:28px;line-height:1.3;overflow-wrap:anywhere}h2{margin-top:32px;font-size:20px}a{color:var(--link);text-underline-offset:3px;overflow-wrap:anywhere}small{color:var(--muted)}section{border-top:1px solid var(--border);margin-top:28px;padding-top:8px}input,button{font:inherit;border-radius:6px;min-height:48px}input{width:100%;max-width:420px;padding:10px 12px;margin:8px 0 16px;border:1px solid var(--outline);background:var(--surface);color:var(--text)}button{padding:10px 18px;background:#006f93;color:white;border:1px solid #006f93;font-weight:600;cursor:pointer}button:hover:not(:disabled){background:#005875}button:disabled{opacity:.6;cursor:wait}:focus-visible{outline:2px solid var(--link);outline-offset:3px}
</style></head><body><main><small>inno derneği</small><h1>${title}</h1>${body}</main></body></html>`;

export const registerPublicRoutes = (app: FastifyInstance) => {
  app.get('/support', async (_request, reply) =>
    reply.type('text/html; charset=utf-8').send(page('inno derneği uygulama desteği',
      `<p>Başvuru, belge yükleme ve hesabınızla ilgili destek için <a href="mailto:innodernegi@gmail.com">innodernegi@gmail.com</a> adresine yazabilirsiniz.</p>
      <p>Mesajınızda sorunun görüldüğü ekranı ve cihaz türünü belirtin. Şifrenizi, kimlik belgenizi veya sağlık bilgilerinizi e-postaya eklemeyin.</p>
      <section><h2>Hesap ve gizlilik</h2><p><a href="/account-deletion">Hesap ve veri silme talebi</a></p><p><a href="/privacy">Gizlilik ve KVKK aydınlatma metni</a></p></section>`)),
  );
  app.get('/privacy', async (_request, reply) =>
    reply.header('Cache-Control', 'no-cache').type('text/html; charset=utf-8').send(
      page(
        'Gizlilik Politikası ve KVKK Aydınlatma Metni',
        `<p>Son güncelleme: <time datetime="2026-11-21">21 Kasım 2026</time></p>
    <p>Bu metin, inno derneği mobil uygulaması ve başvuruları yönetmek için kullanılan panelde kişisel verilerin nasıl işlendiğini açıklar.</p>
    <p><strong>Veri sorumlusu:</strong> İNNO Derneği. Posta iletişim adresi: Zincirlikuyu Mahallesi, İkizkavak Caddesi No: 9B, Tepebaşı / Eskişehir, Türkiye.<br><strong>KVKK başvuruları:</strong> <a href="mailto:innodernegi@gmail.com?subject=KVKK%20Ba%C5%9Fvurusu">innodernegi@gmail.com</a>.</p>
    <section><h2>Hangi verileri, neden işliyoruz?</h2>
    <ul>
      <li><strong>Kayıt ve iletişim:</strong> Ad, e-posta, varsa telefon, ülke ve şehir, kullanıcı kimliği ve başvurmak istediğiniz etkinliğin bağlantısı. Bu bilgiler kayıt talebini değerlendirmek, hesabı yönetmek ve sizinle iletişim kurmak için kullanılır.</li>
      <li><strong>Başvuru ve program:</strong> Doğum tarihi, uyruk, kimlik veya pasaport bilgileri, CV, motivasyon, başvuru durumu ve yüklediğiniz PDF veya görseller. Projeye göre bunlar seyahat kayıtlarını, biniş kartlarını veya ödeme belgesini de içerebilir. Bunlar başvuruyu incelemek ve başvuru, hareketlilik ve dönüş işlemlerini yürütmek için kullanılır.</li>
      <li><strong>Mesajlar ve işlem kayıtları:</strong> Uygulama içindeki yazışmalar, destek için gönderdiğiniz içerik, oturum kayıtları ve işlem zamanı ile IP adresi gibi teknik kayıtlar. Bunlar destek sağlamak, yetkisiz erişimi önlemek ve yönetim işlemlerini denetlemek için kullanılır.</li>
    </ul>
    <p>Veriler doğrudan doldurduğunuz formlardan, seçtiğiniz dosyalardan, gönderdiğiniz mesajlardan ve sistemin otomatik oluşturduğu işlem kayıtlarından elde edilir. Kamera izni vermek istemezseniz belgeleri cihazınızdan seçebilirsiniz. Şehir ve ülke bilgisi cihaz konumundan değil, formdaki beyanınızdan alınır.</p>
    <p>Hesap, başvuru ve program işlemleri için doğrudan gerekli bilgileri katılım ilişkisinin kurulması ve yürütülmesi kapsamında (6698 sayılı Kanun m. 5/2-c); sistem güvenliği ve denetim kayıtlarını, temel hak ve özgürlüklere zarar vermemek kaydıyla meşru menfaat kapsamında (m. 5/2-f) işleriz. Kanuni bir yükümlülüğün yerine getirilmesi veya bir hakkın korunması gerektiğinde ilgili kayıtlar bu amaçlarla sınırlı olarak işlenir (m. 5/2-ç ve m. 5/2-e). Açık rızaya dayanan işlemler için rıza ayrıca alınır.</p></section>
    <section><h2>İsteğe bağlı kan grubu</h2><p>Kan grubu kayıt sırasında veya genel profilde istenmez. Bu bilgiyi isteyen bir Avrupa Dayanışma Programı (ESC) projesinde alan açıldığında, yalnızca o projedeki başvuru ve hareketlilik işlemleri için ayrı açık rıza vererek paylaşabilirsiniz (m. 6/3-a). Paylaşmamanız başvurunuzu engellemez. Değer şifreli tutulur, başka başvurulara kopyalanmaz, dışa aktarıma ve uygulamanın günlük veritabanı yedeklerine eklenmez.</p>
    <p>Yalnız siz ve yetkili yöneticiler değeri görebilirsiniz. Başvuru ayrıntısında <strong>Rızamı geri al</strong> seçeneğiyle canlı kaydı silebilirsiniz. Projenin bu bilgiyi istemeyi bırakması, arşivlenmesi, başvurunun reddedilmesi veya dönüşün tamamlanması da değeri siler.</p></section>
    <section><h2>Kimler erişir, paylaşım nasıl yapılır?</h2>
    <p>Başvurunuz ve belgeleriniz herkese açık değildir. İşlemleri yürütmekle görevli dernek yetkilileri bunlara görevleri kapsamında erişir. Natro, uygulama ve belgeler için barındırma altyapısını sağlar. Altyapı sağlayıcılarının erişebildiği verilerin bu metindeki korumalara denk gizlilik ve güvenlik koşullarına tabi olması gerekir.</p>
    <p>Uygulama, proje ortaklarına otomatik dosya göndermez. Yetkili yöneticiler, bir programın yürütülmesi için gerektiğinde ilgili başvuru belgelerini o programın ortaklarıyla uygulama dışında paylaşabilir. Yasal talep veya zorunluluk halinde gerekli kayıtlar yetkili kurumlara iletilebilir. Böyle bir paylaşım yalnız ilgili iş için gerekli verilerle ve KVKK’nın aktarım şartlarıyla sınırlıdır. Yurt dışı aktarımı gerekiyorsa Kanun’un 9. maddesindeki koşullar uygulanır; ilgili alıcılar hakkında derneğe başvurabilirsiniz.</p>
    <p>Uygulama kişisel verileri satmaz, hedefli reklam için kullanmaz ve başka uygulamalar veya siteler arasında reklam amaçlı takip yapmaz.</p></section>
    <section><h2>Saklama ve silme</h2>
    <p>Hesap ve başvuru kayıtları, hesap yönetimi, programın yürütülmesi ve varsa yasal saklama veya hakların korunması için gerekli olduğu sürece tutulur. Bir başvurunun tamamlanması veya reddedilmesi, diğer başvuru kayıtlarını otomatik olarak silmez. Uygulamanın şifreli günlük yedekleri yaklaşık 30 gün döngüsünde temizlenir; bir canlı kayıt silindiğinde önceki yedek kopyası hemen silinmeyebilir.</p>
    <p>Uygulamada <strong>Ayarlar → Gizlilik ve Hesap → Hesap Silme Talebi</strong> yolundan talebinizi oluşturabilirsiniz. Hesaba erişemiyorsanız <a href="/account-deletion">hesap ve veri silme sayfasındaki</a> e-posta yolunu kullanın. Talep işlendiğinde profil anonimleştirilir ve saklama yükümlülüğü bulunmayan başvuru belgeleri silinir.</p></section>
    <section><h2>Haklarınızı nasıl kullanırsınız?</h2>
    <p>KVKK’nın 11. maddesi kapsamında verilerinizin işlenip işlenmediğini, işleniyorsa hangi amaçla kullanıldığını ve yurt içi veya dışındaki alıcıları sorabilirsiniz. Düzeltme, şartları oluştuğunda silme veya imha ve bu işlemlerin alıcılara bildirilmesini isteyebilirsiniz. Yalnız otomatik işlemden doğan aleyhinize sonuca itiraz edebilir veya hukuka aykırı işlemeden doğan zararınızın giderilmesini talep edebilirsiniz. Açık rızaya dayanan işlemlerde rızanızı geri alabilirsiniz.</p>
    <p>Başvurunuzu yukarıdaki posta adresine veya sistemimizde kayıtlı e-posta adresinizden <a href="mailto:innodernegi@gmail.com?subject=KVKK%20Ba%C5%9Fvurusu">innodernegi@gmail.com</a> adresine iletin. Şifrenizi, kimlik belgesi kopyanızı veya sağlık verinizi e-postaya eklemeyin.</p></section>`,
      ),
    ),
  );
  app.get('/account-deletion', async (_request, reply) =>
    reply.type('text/html; charset=utf-8').send(
      page(
        'Hesap ve Veri Silme',
        `<p>inno derneği mobil uygulamasında <strong>Ayarlar → Gizlilik ve Hesap → Hesap Silme Talebi</strong> yolunu izleyin. Kimliğiniz aktif oturum üzerinden doğrulanır ve talep kayıt altına alınır.</p>
    <section><h2>Silinen veriler</h2><p>Hesap profili ve hukuki saklama zorunluluğu bulunmayan başvuru belgeleri silinir veya anonimleştirilir. Yasal olarak tutulması gereken sınırlı işlem kayıtları erişimi kısıtlanarak saklanabilir.</p></section>
    <section><h2>Uygulamaya erişemiyorsanız</h2><p>Uygulamayı yeniden yüklemeden, kayıtlı e-posta hesabınızdan <a href="mailto:innodernegi@gmail.com?subject=Inno%20hesap%20ve%20veri%20silme%20talebi">innodernegi@gmail.com adresine hesap ve veri silme talebi gönderin</a>. Kimlik doğrulaması tamamlanmadan veri silinmez. Şifrenizi veya kimlik belgenizin kopyasını e-postaya eklemeyin.</p></section>`,
      ),
    ),
  );
  app.get('/reset-password', async (request, reply) => {
    const token =
      typeof (request.query as { token?: unknown }).token === 'string'
        ? String((request.query as { token: string }).token)
        : '';
    const content = `<p>Yeni şifreniz en az 12 karakter; büyük harf, küçük harf ve rakam içermelidir.</p>
      <section><form id="reset-form"><label>Yeni şifre<br><input id="password" type="password" autocomplete="new-password" minlength="12" required></label><br><button id="submit">Şifreyi güncelle</button></form><p id="result" role="status" aria-live="polite"></p></section>
      <script>const token=${JSON.stringify(token).replaceAll(
        '<',
        '\\u003c',
      )};history.replaceState(null,'',location.pathname);document.getElementById('reset-form').addEventListener('submit',async(e)=>{e.preventDefault();const result=document.getElementById('result'),button=document.getElementById('submit'),password=document.getElementById('password');if(button.disabled)return;button.disabled=true;result.textContent='İşlem sürüyor…';try{const response=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,newPassword:password.value})});const data=await response.json();result.textContent=data.message||'İşlem tamamlanamadı.';if(response.ok){password.value='';document.getElementById('reset-form').hidden=true;}}catch{result.textContent='Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';}finally{button.disabled=false;}});</script>`;
    return reply
      .header('Cache-Control', 'no-store')
      .type('text/html; charset=utf-8')
      .send(page('Şifre Sıfırlama', content));
  });
};
