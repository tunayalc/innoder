import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackButton,
  Button,
  Card,
  ContactLinksCard,
  InputField,
  SettingsButton,
} from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { layout, useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { RootStackNavigationProp } from '../../types';
import { appConfig } from '../../config/appConfig';
import { openExternalUrl } from '../../utils/contact';
import { isValidEmail } from '../../utils/validation';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { registerCandidate } = useAuth();
  const { t } = useI18n();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const openPrivacyNotice = async () => {
    try {
      await openExternalUrl(appConfig.privacyPolicyUrl);
    } catch {
      Alert.alert(t('common.errorTitle'), t('settings.linkError'));
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillNameEmail'));
      return;
    }
    if (!eventLink.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.eventLinkRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(t('common.errorTitle'), t('auth.validEmail'));
      return;
    }
    if (!noticeAccepted || !kvkkAccepted) {
      Alert.alert(t('common.errorTitle'), t('auth.kvkkRequired'));
      return;
    }

    const result = await registerCandidate({
      fullName,
      email,
      eventLink,
      kvkkAccepted,
      noticeAccepted,
      noticeVersion: '2026-01',
      consentVersion: '2026-01',
    });
    if (result?.ok) {
      Alert.alert(
        t('auth.passwordRequestSuccessTitle'),
        result.message || t('auth.passwordRequestSuccessText'),
        [{ text: t('auth.ok'), onPress: () => navigation.navigate('Login') }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <BackButton />

          <View style={styles.topControls}>
            <SettingsButton />
          </View>
        </View>

        <View style={styles.headerCard}>
          <Text accessibilityRole="header" style={styles.title}>{t('auth.registerTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          <Text style={styles.helperText}>{t('auth.registerPasswordInfo')}</Text>
        </View>

        <View style={styles.formCard}>
          <InputField
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('auth.fullNamePlaceholder')}
            autoCapitalize="words"
            autoComplete="name"
            editable={!isLoading}
            style={styles.formControl}
          />
          <View style={styles.spacer16} />
          <InputField
            label={t('auth.emailRequired')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.formControl}
          />
          <View style={styles.spacer16} />
          <InputField
            label={t('auth.eventLinkLabel')}
            keyboardType="url"
            editable={!isLoading}
            value={eventLink}
            onChangeText={setEventLink}
            placeholder={t('auth.eventLinkPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.formControl}
          />
        </View>

        <Card style={styles.kvkkCard}>
          <View style={styles.kvkkRow}>
            <View style={styles.kvkkTextWrap}>
              <Text style={styles.kvkkTitle}>{t('auth.noticeTitle')}</Text>
              <Text style={styles.kvkkText}>{t('auth.noticeRead')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('auth.noticeRead')}
              value={noticeAccepted}
              onValueChange={setNoticeAccepted}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
          <Button
            label={t('auth.noticeOpen')}
            variant="ghost"
            onPress={openPrivacyNotice}
            style={styles.noticeButton}
          />
        </Card>

        <Card style={styles.kvkkCard}>
          <View style={styles.kvkkRow}>
            <View style={styles.kvkkTextWrap}>
              <Text style={styles.kvkkTitle}>{t('auth.kvkkTitle')}</Text>
              <Text style={styles.kvkkText}>{t('auth.kvkkText')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('auth.kvkkTitle')}
              value={kvkkAccepted}
              onValueChange={setKvkkAccepted}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? t('auth.registerLoading') : t('auth.passwordRequestButton')}
          onPress={handleRegister}
          loading={isLoading}
          style={styles.registerButton}
        />

        <ContactLinksCard
          title={t('auth.contactTitle')}
          subtitle={t('auth.contactSubtitle')}
        />

        <TouchableOpacity accessibilityRole="button" style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>{t('auth.backToLogin')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    noticeButton: {
      marginTop: 12,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    scrollContent: {
      paddingTop: 16,
      width: '100%',
      maxWidth: layout.formMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.screenPadding,
      gap: 20,
    } as ViewStyle,
    topBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    topControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      flex: 1,
    } as ViewStyle,
    headerCard: {
      paddingVertical: 8,
      gap: 10,
    } as ViewStyle,
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    } as TextStyle,
    helperText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    formCard: {
      paddingVertical: 8,
    } as ViewStyle,
    formControl: {
      minHeight: 52,
      width: '100%',
    } as TextStyle,
    kvkkCard: {
      borderRadius: 8,
    } as ViewStyle,
    kvkkRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,
    kvkkTextWrap: {
      flex: 1,
    } as ViewStyle,
    kvkkTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    kvkkText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    } as TextStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
    } as TextStyle,
    registerButton: {
      minHeight: 54,
      width: '100%',
    } as ViewStyle,
    loginLink: {
      minHeight: 44,
      justifyContent: 'center',
    } as ViewStyle,
    loginText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
    } as TextStyle,
    spacer16: {
      height: 16,
    } as ViewStyle,
  });
