import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, FeatureRow, ScreenScrollView, SectionHeader } from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { useThemedStyles, type AppColors } from '../../theme';
import type { RootStackNavigationProp } from '../../types';
import { isEuropassCvComplete, isMotivationLetterComplete } from '../../utils/europass';

const initials = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');

export const AdayProfilScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user, logout } = useAuth();
  const { t, language } = useI18n();
  const en = language === 'en';
  const applications = useAppSelector(selectApplications);
  const latest = useMemo(
    () =>
      applications
        .filter(application => application.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    [applications, user?.id],
  );

  const confirmLogout = () =>
    Alert.alert(t('common.logoutTitle'), t('common.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: logout },
    ]);

  const done = en ? 'Complete' : 'Tamam';
  const todo = en ? 'To do' : 'Eksik';

  return (
    <ScreenScrollView safeTop inTabs contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <View style={styles.identityText}>
          <Text accessibilityRole="header" style={styles.name}>{user?.name || t('candidateMenu.fallbackName')}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>
      </View>

      <SectionHeader title={en ? 'My profile' : 'Profilim'} />
      <Card style={styles.group}>
        <FeatureRow
          icon="card-account-details-outline"
          title={t('nav.personalInfo')}
          description={en ? 'Identity, contact and travel details' : 'Kimlik, iletişim ve seyahat bilgileri'}
          onPress={() => navigation.navigate('AdayKisisel')}
        />
        {latest ? (
          <>
            <View style={styles.divider} />
            <FeatureRow
              icon="file-account-outline"
              title={t('nav.europassCv')}
              badge={isEuropassCvComplete(latest.personalInfo.europassCv) ? done : todo}
              onPress={() => navigation.navigate('AdayCvBuilder', { applicationId: latest.id })}
            />
            <View style={styles.divider} />
            <FeatureRow
              icon="file-edit-outline"
              title={t('nav.motivationLetter')}
              badge={isMotivationLetterComplete(latest.personalInfo.motivationLetter) ? done : todo}
              onPress={() => navigation.navigate('AdayMotivation', { applicationId: latest.id })}
            />
          </>
        ) : null}
      </Card>

      <SectionHeader title={en ? 'Account' : 'Hesap'} />
      <Card style={styles.group}>
        <FeatureRow
          icon="lock-reset"
          tone="info"
          title={en ? 'Change password' : 'Şifreyi değiştir'}
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <View style={styles.divider} />
        <FeatureRow
          icon="cog-outline"
          tone="info"
          title={t('common.settings')}
          description={en ? 'Theme, language, privacy and account deletion' : 'Tema, dil, gizlilik ve hesap silme'}
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>

      <Button label={t('common.logout')} variant="outline" icon="logout-variant" onPress={confirmLogout} />
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { gap: 14, paddingBottom: 32 } as ViewStyle,
    identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 } as ViewStyle,
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    avatarText: { fontSize: 26, fontWeight: '700', color: colors.white } as TextStyle,
    identityText: { flex: 1, gap: 2 } as ViewStyle,
    name: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    email: { fontSize: 15, color: colors.textSecondary } as TextStyle,
    group: { paddingVertical: 4, gap: 0 } as ViewStyle,
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginLeft: 58 } as ViewStyle,
  });
