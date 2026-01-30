import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenId =
  | 'home'
  | 'aday-menu'
  | 'admin-menu'
  | 'data-model'
  | 'aday-kayit'
  | 'aday-egitim'
  | 'aday-kisisel'
  | 'aday-belge'
  | 'aday-mesaj'
  | 'admin-liste'
  | 'admin-detay'
  | 'admin-dogrulama'
  | 'admin-audit';

type NavEntry = { id: ScreenId; title: string };

type ScreenProps = {
  push: (id: ScreenId, title: string) => void;
  pop: () => void;
  canGoBack: boolean;
  title: string;
};

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <PrototypeNavigator />
    </SafeAreaProvider>
  );
}

function PrototypeNavigator() {
  const safeAreaInsets = useSafeAreaInsets();
  const [stack, setStack] = useState<NavEntry[]>([
    { id: 'home', title: 'Inno Prototype' },
  ]);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  const push = (id: ScreenId, title: string) => {
    setStack((prev) => [...prev, { id, title }]);
  };

  const pop = () => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const ScreenComponent = useMemo(() => {
    switch (current.id) {
      case 'home':
        return HomeScreen;
      case 'aday-menu':
        return AdayMenuScreen;
      case 'admin-menu':
        return AdminMenuScreen;
      case 'data-model':
        return DataModelScreen;
      case 'aday-kayit':
        return AdayKayitScreen;
      case 'aday-egitim':
        return AdayEgitimScreen;
      case 'aday-kisisel':
        return AdayKisiselScreen;
      case 'aday-belge':
        return AdayBelgeScreen;
      case 'aday-mesaj':
        return AdayMesajScreen;
      case 'admin-liste':
        return AdminListeScreen;
      case 'admin-detay':
        return AdminDetayScreen;
      case 'admin-dogrulama':
        return AdminDogrulamaScreen;
      case 'admin-audit':
        return AdminAuditScreen;
      default:
        return HomeScreen;
    }
  }, [current.id]);

  return (
    <View style={styles.root}>
      <View style={styles.orbA} />
      <View style={styles.orbB} />
      <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
        <Text style={styles.headerTitle}>{current.title}</Text>
        {canGoBack ? (
          <Pressable style={styles.headerBack} onPress={pop}>
            <Text style={styles.headerBackText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenComponent push={push} pop={pop} canGoBack={canGoBack} title={current.title} />
      </ScrollView>
    </View>
  );
}

function HomeScreen({ push }: ScreenProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.h1}>Tek kaynakli basvuru akisi</Text>
      <Text style={styles.subtitle}>
        Bu prototip, aday ve admin akislarini tiktoklanabilir bir sekilde gosteren
        basit bir mobil arayuzdur. Sadece gorsel sunum amaclidir.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hizli Giris</Text>
        <Button label="Aday Ekranlari" onPress={() => push('aday-menu', 'Aday Ekranlari')} />
        <Button label="Admin Ekranlari" onPress={() => push('admin-menu', 'Admin Ekranlari')} />
        <Button label="Veri Modeli" onPress={() => push('data-model', 'Veri Modeli')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ozet Akis</Text>
        <Text style={styles.bodyText}>1) Kayit ve iletisim dogrulama</Text>
        <Text style={styles.bodyText}>2) Program bilgilendirme + checklist</Text>
        <Text style={styles.bodyText}>3) Kisisel bilgi formu</Text>
        <Text style={styles.bodyText}>4) Belge tarama / yukleme</Text>
        <Text style={styles.bodyText}>5) Admin dogrulama + mesaj</Text>
        <View style={styles.pillRow}>
          <Pill label="OK" variant="ok" />
          <Pill label="EKSIK" variant="warn" />
          <Pill label="YANLIS FORMAT" variant="err" />
          <Pill label="OKUNMADI" variant="info" />
        </View>
      </View>
    </View>
  );
}

function AdayMenuScreen({ push }: ScreenProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Aday ekranlari</Text>
      <Text style={styles.subtitle}>Kullanici tarafindaki temel adimlar.</Text>
      <MenuItem label="Kayit Formu" onPress={() => push('aday-kayit', 'Kayit Formu')} />
      <MenuItem label="Egitim Bilgilendirme" onPress={() => push('aday-egitim', 'Egitim Bilgilendirme')} />
      <MenuItem label="Kisisel Bilgi Formu" onPress={() => push('aday-kisisel', 'Kisisel Bilgi')} />
      <MenuItem label="Belge Tarama / Yukleme" onPress={() => push('aday-belge', 'Belge Tarama')} />
      <MenuItem label="Mesajlasma" onPress={() => push('aday-mesaj', 'Mesajlasma')} />
    </View>
  );
}

function AdminMenuScreen({ push }: ScreenProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Admin ekranlari</Text>
      <Text style={styles.subtitle}>Liste, dogrulama ve audit akisiyla.</Text>
      <MenuItem label="Basvuru Listesi" onPress={() => push('admin-liste', 'Basvuru Listesi')} />
      <MenuItem label="Basvuru Detayi" onPress={() => push('admin-detay', 'Basvuru Detayi')} />
      <MenuItem label="Dogrulama Karari" onPress={() => push('admin-dogrulama', 'Dogrulama Karari')} />
      <MenuItem label="Audit Log" onPress={() => push('admin-audit', 'Audit Log')} />
    </View>
  );
}

function AdayKayitScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Kayit Formu</Text>
      <Field label="Ad Soyad" value="Aylin Demir" />
      <Field label="E-posta" value="aylin@ornek.com" />
      <Field label="Telefon" value="+90 5xx xxx xx xx" />
      <View style={styles.switchRow}>
        <Text style={styles.bodyText}>KVKK Onayi</Text>
        <View style={styles.switchOn}>
          <View style={styles.switchDot} />
        </View>
      </View>
      <Button label="Hesap Olustur" />
    </View>
  );
}

function AdayEgitimScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Egitim Bilgilendirme</Text>
      <Text style={styles.subtitle}>Program A / 2026</Text>
      <ChecklistRow label="Kimlik Belgesi" status="EKSIK" variant="warn" />
      <ChecklistRow label="Basvuru Formu" status="OK" variant="ok" />
      <ChecklistRow label="Ek Belge" status="OKUNMADI" variant="info" />
      <Button label="Belge Ornekleri" variant="ghost" />
    </View>
  );
}

function AdayKisiselScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Kisisel Bilgi</Text>
      <Field label="Program Secimi" value="Program A" />
      <Field label="Dogum Tarihi" value="GG.AA.YYYY" />
      <Field label="Kimlik No" value="***********" />
      <View style={styles.notice}>
        <Text style={styles.noticeText}>Form taslak olarak saklanir. Baglanti gelince gonderilir.</Text>
      </View>
      <Button label="Basvuru Gonder" />
    </View>
  );
}

function AdayBelgeScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Belge Tarama</Text>
      <View style={styles.scanBox}>
        <View style={styles.scanGuide} />
        <Text style={styles.bodyText}>Kamerayi hizala</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.bodyText}>Belge Tipi</Text>
        <Text style={styles.selectBox}>Kimlik / PDF</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.bodyText}>Kalite Kontrol</Text>
        <View style={styles.bars}>
          <View style={styles.barActive} />
          <View style={styles.barActive} />
          <View style={styles.barMuted} />
        </View>
      </View>
      <Button label="Yukle" />
    </View>
  );
}

function AdayMesajScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Mesajlasma</Text>
      <View style={styles.msgAdmin}>
        <Text style={styles.bodyText}>Kimlik belgesi eksik. Lutfen yeniden yukleyiniz.</Text>
      </View>
      <View style={styles.msgUser}>
        <Text style={styles.bodyText}>Bugun tekrar gonderecegim.</Text>
      </View>
      <View style={styles.msgAdmin}>
        <Text style={styles.bodyText}>Belge bulanik. OKUNMADI verdik.</Text>
      </View>
      <Button label="Mesaj Gonder" />
    </View>
  );
}

function AdminListeScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Basvuru Listesi</Text>
      <ListRow name="Aylin Demir" subtitle="2 belge eksik" label="NEEDS_FIX" variant="warn" />
      <ListRow name="Kerem Kaya" subtitle="Belge okunmadi" label="OKUNMADI" variant="info" />
      <ListRow name="Selin Bora" subtitle="Hazir" label="OK" variant="ok" />
    </View>
  );
}

function AdminDetayScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Basvuru Detayi</Text>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <View>
          <Text style={styles.bodyText}>Aylin Demir</Text>
          <Text style={styles.subtitle}>Program A / 2026</Text>
        </View>
      </View>
      <ChecklistRow label="Kimlik Belgesi" status="EKSIK" variant="warn" />
      <ChecklistRow label="Basvuru Formu" status="OK" variant="ok" />
      <ChecklistRow label="Ek Belge" status="YANLIS FORMAT" variant="err" />
      <Button label="Dogrula / Mesaj Gonder" />
    </View>
  );
}

function AdminDogrulamaScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Dogrulama Karari</Text>
      <View style={styles.previewBox} />
      <View style={styles.pillRow}>
        <Pill label="OK" variant="ok" />
        <Pill label="EKSIK" variant="warn" />
        <Pill label="YANLIS FORMAT" variant="err" />
        <Pill label="OKUNMADI" variant="info" />
      </View>
      <View style={styles.textArea}>
        <Text style={styles.bodyText}>Aciklama / not</Text>
      </View>
      <Button label="Durumu Kaydet" />
    </View>
  );
}

function AdminAuditScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Audit Log</Text>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:12] USER_REGISTERED #102</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:22] DOCUMENT_UPLOADED #901</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:40] ADMIN_VERIFIED #901</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:41] MESSAGE_SENT #555</Text>
      </View>
    </View>
  );
}

function DataModelScreen() {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Veri Modeli</Text>
      <Text style={styles.subtitle}>Her ekranin urettigi bilgi DB'de karsilik bulur.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>users</Text>
        <Text style={styles.bodyText}>kimlik, iletisim, dogrulama, KVKK</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>applications</Text>
        <Text style={styles.bodyText}>program, form verisi, basvuru durumu</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>documents</Text>
        <Text style={styles.bodyText}>belge tipi, dosya, parse sonucu, status</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>messages</Text>
        <Text style={styles.bodyText}>basvuruya bagli mesajlasma</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>audit_log</Text>
        <Text style={styles.bodyText}>REGISTER / SUBMIT / UPLOAD / VERIFY</Text>
      </View>
    </View>
  );
}

function Button({ label, onPress, variant = 'solid' }: { label: string; onPress?: () => void; variant?: 'solid' | 'ghost' }) {
  return (
    <Pressable
      style={[styles.button, variant === 'ghost' && styles.buttonGhost]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}>{label}</Text>
    </Pressable>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.menuArrow}>{'>'}</Text>
    </Pressable>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputFake}>
        <Text style={styles.bodyText}>{value}</Text>
      </View>
    </View>
  );
}

function Pill({ label, variant }: { label: string; variant: 'ok' | 'warn' | 'err' | 'info' }) {
  return (
    <View style={[styles.pill, styles[`pill_${variant}`]]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function ChecklistRow({ label, status, variant }: { label: string; status: string; variant: 'ok' | 'warn' | 'err' | 'info' }) {
  return (
    <View style={styles.checkRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <Pill label={status} variant={variant} />
    </View>
  );
}

function ListRow({ name, subtitle, label, variant }: { name: string; subtitle: string; label: string; variant: 'ok' | 'warn' | 'err' | 'info' }) {
  return (
    <View style={styles.listRow}>
      <View>
        <Text style={styles.bodyText}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pill label={label} variant={variant} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F1EC',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B19',
  },
  headerBack: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  headerBackText: {
    color: '#B94C1F',
    fontWeight: '700',
  },
  orbA: {
    position: 'absolute',
    top: -140,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(240, 103, 43, 0.18)',
  },
  orbB: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
  },
  section: {
    marginTop: 16,
    gap: 12,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1B19',
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B19',
  },
  subtitle: {
    color: '#6B6762',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.08)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B19',
  },
  bodyText: {
    color: '#1C1B19',
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pill_ok: {
    backgroundColor: 'rgba(15, 118, 110, 0.18)',
  },
  pill_warn: {
    backgroundColor: 'rgba(240, 103, 43, 0.18)',
  },
  pill_err: {
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
  },
  pill_info: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1B19',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F0672B',
    alignItems: 'center',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(240, 103, 43, 0.4)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonTextGhost: {
    color: '#B94C1F',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.08)',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B94C1F',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: '#8B8681',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputFake: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F4EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  switchOn: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#0F766E',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  switchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  notice: {
    backgroundColor: '#FEF6EA',
    padding: 12,
    borderRadius: 12,
  },
  noticeText: {
    color: '#8A5A21',
    fontSize: 12,
  },
  scanBox: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(15, 118, 110, 0.35)',
    padding: 16,
    backgroundColor: '#F2FBF9',
    gap: 8,
  },
  scanGuide: {
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(15, 118, 110, 0.4)',
    color: '#0F766E',
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  barActive: {
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  barMuted: {
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5D1',
  },
  msgAdmin: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF1E8',
  },
  msgUser: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E7F5F3',
    alignSelf: 'flex-end',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.08)',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 27, 25, 0.08)',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.12)',
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9F7F3',
  },
  logItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 25, 0.08)',
  },
});

export default App;
