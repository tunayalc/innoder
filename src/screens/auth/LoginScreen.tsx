import React from 'react';
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
  Button,
  ContactLinksCard,
  InputField,
  LanguageSwitcher,
  ThemeSwitcher,
} from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectRememberMe, selectUserError, selectUserLoading } from '../../store/selectors';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { loginCandidate, loginDemoCandidate } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const rememberedPreference = useAppSelector(selectRememberMe);
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(rememberedPreference);

  React.useEffect(() => {
    setRememberMe(rememberedPreference);
  }, [rememberedPreference]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillEmailPassword'));
      return;
    }
    loginCandidate({ email, password, rememberMe });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerControls}>
          <ThemeSwitcher compact />
          <LanguageSwitcher compact />
        </View>

        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label={t('common.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <InputField
            label={t('common.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
          />

          <View style={styles.rememberRow}>
            <View style={styles.rememberTextWrap}>
              <Text style={styles.rememberTitle}>{t('auth.rememberMe')}</Text>
            </View>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            label={isLoading ? t('auth.loginButtonLoading') : t('auth.loginButton')}
            onPress={isLoading ? undefined : handleLogin}
          />

          <Button
            label={isLoading ? t('auth.demoButtonLoading') : t('auth.demoButton')}
            variant="ghost"
            onPress={isLoading ? undefined : () => loginDemoCandidate(rememberMe)}
          />

          <Text style={styles.helperText}>{t('auth.loginAllowedOnly')}</Text>

          <ContactLinksCard
            title={t('auth.contactTitle')}
            subtitle={t('auth.contactSubtitle')}
          />

          <TouchableOpacity onPress={() => navigation.navigate('OnboardingIntro')}>
            <Text style={styles.linkText}>
              {t('auth.noAccount')} <Text style={styles.linkStrong}>{t('auth.watchVideosFirst')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={styles.footerText}>{t('auth.adminLoginLink')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      gap: 18,
    } as ViewStyle,
    headerControls: {
      flexDirection: 'row',
      gap: 8,
      alignSelf: 'flex-start',
    } as ViewStyle,
    header: {
      gap: 10,
    } as ViewStyle,
    accentBar: {
      width: 28,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
    } as ViewStyle,
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
    } as TextStyle,
    form: {
      gap: 16,
    } as ViewStyle,
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    rememberTextWrap: {
      flex: 1,
    } as ViewStyle,
    rememberTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    } as TextStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
    } as TextStyle,
    helperText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
    } as TextStyle,
    linkText: {
      fontSize: 14,
      color: colors.textSecondary,
    } as TextStyle,
    linkStrong: {
      color: colors.primary,
      fontWeight: '700',
    } as TextStyle,
    footer: {
      marginTop: 'auto' as any,
      alignItems: 'center',
      paddingTop: 24,
    } as ViewStyle,
    footerText: {
      fontSize: 14,
      color: colors.textMuted,
    } as TextStyle,
  });

