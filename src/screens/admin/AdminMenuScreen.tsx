import React from 'react';
import { Alert, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useThemedStyles, type AppColors } from '../../theme';
import { useI18n } from '../../i18n';
import { Button, Card, FeatureRow, ScreenScrollView, SectionHeader } from '../../components';
import { useAuth } from '../../hooks';

// "Yönetim" tab: every management area plus account actions.
export const AdminMenuScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { t, language } = useI18n();
  const en = language === 'en';
  const tx = (tr: string, english: string) => (en ? english : tr);
  const { user, logout } = useAuth();
  const initials = (user?.name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');

  const confirmLogout = () =>
    Alert.alert(t('common.logoutTitle'), t('common.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: logout },
    ]);

  return (
    <ScreenScrollView safeTop inTabs contentContainerStyle={styles.section}>
      <View style={styles.identity}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.identityText}>
          <Text accessibilityRole="header" style={styles.name}>{user?.name || tx('Yönetici', 'Admin')}</Text>
          <Text style={styles.role}>
            {user?.role === 'super_admin' ? tx('Süper yönetici', 'Super admin') : tx('Yönetici', 'Admin')}
            {user?.email ? ` · ${user.email}` : ''}
          </Text>
        </View>
      </View>

      <SectionHeader title={tx('Süreçler', 'Workflows')} />
      <Card style={styles.group}>
        <FeatureRow icon="message-text-outline" title={tx('Mesajlar', 'Messages')} description={tx('Genel ve başvuru konuşmaları', 'General and application threads')} onPress={() => navigation.navigate('AdminOperations', { section: 'messages' })} />
        <View style={styles.divider} />
        <FeatureRow icon="folder-plus-outline" title={tx('Program yönetimi', 'Programs')} description={tx('Program açın, belge listesini ve tarihleri düzenleyin', 'Create programs, edit checklists and dates')} onPress={() => navigation.navigate('AdminProgramManagement')} />
        <View style={styles.divider} />
        <FeatureRow icon="account-remove-outline" tone="warn" title={tx('Hesap silme talepleri', 'Deletion requests')} description={tx('Anonimleştirme ve belge temizliği', 'Anonymisation and file cleanup')} onPress={() => navigation.navigate('AdminOperations', { section: 'deletions' })} />
      </Card>

      <SectionHeader title={tx('Denetim ve erişim', 'Audit and access')} />
      <Card style={styles.group}>
        <FeatureRow icon="history" tone="info" title={t('common.auditLog')} description={tx('Tüm yönetici işlemlerinin kaydı', 'Record of every admin action')} onPress={() => navigation.navigate('AdminAudit')} />
        {user?.role === 'super_admin' ? (
          <>
            <View style={styles.divider} />
            <FeatureRow icon="account-cog-outline" tone="info" title={tx('Yönetici yönetimi', 'Admins')} description={tx('Yönetici ekleyin ve erişimleri düzenleyin', 'Add admins and manage access')} onPress={() => navigation.navigate('AdminManagement')} />
          </>
        ) : null}
      </Card>

      <SectionHeader title={tx('Hesap', 'Account')} />
      <Card style={styles.group}>
        <FeatureRow icon="lock-reset" tone="info" title={tx('Şifreyi değiştir', 'Change password')} onPress={() => navigation.navigate('ChangePassword')} />
        <View style={styles.divider} />
        <FeatureRow icon="cog-outline" tone="info" title={t('common.settings')} description={tx('Tema, dil ve gizlilik', 'Theme, language and privacy')} onPress={() => navigation.navigate('Settings')} />
      </Card>

      <Button label={t('common.logout')} variant="outline" icon="logout-variant" onPress={confirmLogout} />
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: { gap: 14, paddingBottom: 32 } as ViewStyle,
    identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 } as ViewStyle,
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.heroBg,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    avatarText: { fontSize: 24, fontWeight: '700', color: colors.heroText } as TextStyle,
    identityText: { flex: 1, gap: 2 } as ViewStyle,
    name: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    role: { fontSize: 14, color: colors.textSecondary } as TextStyle,
    group: { paddingVertical: 4, gap: 0 } as ViewStyle,
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginLeft: 58 } as ViewStyle,
  });
