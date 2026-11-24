import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  Button,
  LanguageSwitcher,
  ThemeSwitcher,
  ScreenScrollView,
} from '../../components';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../../services/api/apiClient';
import type { RootStackNavigationProp } from '../../types';
import { openExternalUrl } from '../../utils/contact';
import { useI18n } from '../../i18n';
import { useThemedStyles, type AppColors } from '../../theme';

export const SettingsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { isAuthenticated, logout } = useAuth();
  const sending = React.useRef(false);
  const [deleting, setDeleting] = React.useState(false);
  const openLink = async (url: string) => {
    try {
      await openExternalUrl(url);
    } catch {
      Alert.alert(t('common.errorTitle'), t('settings.linkError'));
    }
  };

  const requestAccountDeletion = () => Alert.alert(
    t('settings.deleteAccount'),
    t('settings.deletionWarning'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deletionSubmit'), style: 'destructive', onPress: async () => {
          if (sending.current) return;
          sending.current = true;
          setDeleting(true);
          try {
            const response = await apiClient.delete<{ message: string }>('/users/me');
            if (!response.data) throw new Error(response.error || t('settings.deletionError'));
            await logout();
            Alert.alert(t('settings.deletionReceived'), response.data.message);
          } catch (error) {
            Alert.alert(t('common.errorTitle'), error instanceof Error ? error.message : t('settings.deletionError'));
          } finally {
            sending.current = false;
            setDeleting(false);
          }
        },
      },
    ],
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text accessibilityRole="header" style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.themeTitle')}</Text>
        <Text style={styles.cardText}>{t('settings.themeText')}</Text>
        <ThemeSwitcher />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.privacyTitle')}</Text>
        <Text style={styles.cardText}>{t('settings.privacyText')}</Text>
        <Button label={t('settings.privacyLink')} variant="ghost" onPress={() => openLink(appConfig.privacyPolicyUrl)} />
        <Button label={t('settings.deletionLink')} variant="ghost" onPress={() => openLink(appConfig.accountDeletionUrl)} />
        <Button label={t('settings.supportLink')} variant="ghost" onPress={() => openLink(appConfig.supportUrl)} />
        {isAuthenticated ? <Button label={t('settings.changePassword')} variant="ghost" onPress={() => navigation.navigate('ChangePassword')} /> : null}
        {isAuthenticated ? <Button label={t('settings.deleteAccount')} variant="ghost" onPress={requestAccountDeletion} loading={deleting} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.languageTitle')}</Text>
        <Text style={styles.cardText}>{t('settings.languageText')}</Text>
        <LanguageSwitcher />
      </View>
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 14,
      backgroundColor: colors.background,
    } as ViewStyle,
    heroCard: {
      paddingVertical: 8,
      gap: 8,
    } as ViewStyle,
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    card: {
      paddingVertical: 20,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    } as ViewStyle,
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    cardText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    } as TextStyle,
  });
