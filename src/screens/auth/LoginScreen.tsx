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
  BackButton,
  InputField,
  SettingsButton,
  BrandWordmark,
} from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectRememberMe, selectUserError, selectUserLoading } from '../../store/selectors';
import { layout, useAppTheme, useThemedStyles, type AppColors } from '../../theme';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { login } = useAuth();
  const { t } = useI18n();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const rememberedPreference = useAppSelector(selectRememberMe);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(rememberedPreference);

  React.useEffect(() => {
    setRememberMe(rememberedPreference);
  }, [rememberedPreference]);

  const handleLogin = () => {
    if (isLoading) return;
    if (!identifier.trim() || !password.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillIdentifierPassword'));
      return;
    }

    login({ identifier, password, rememberMe });
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

        <View style={styles.header}>
          <BrandWordmark compact />
          <Text accessibilityRole="header" style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label={t('auth.identifier')}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t('auth.identifierPlaceholder')}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!isLoading}
            style={styles.formControl}
          />

          <View style={styles.spacer20} />

          <InputField
            label={t('common.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!isLoading}
            style={styles.formControl}
          />

          <View style={styles.rememberRow}>
            <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
            <Switch
              accessibilityLabel={t('auth.rememberMe')}
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>

          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}

          <View style={styles.spacer16} />

          <Button
            label={isLoading ? t('auth.loginButtonLoading') : t('auth.loginButton')}
            onPress={handleLogin}
            loading={isLoading}
            style={styles.formControlButton}
            pressedOpacity={0.86}
          />

          <View style={styles.spacer12} />
          <TouchableOpacity accessibilityRole="button" style={styles.textLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.helperText}>Şifremi unuttum</Text>
          </TouchableOpacity>
          <View style={styles.spacer16} />
          <Text style={styles.helperText}>{t('auth.loginRoleHint')}</Text>
          <View style={styles.spacer12} />
          <Text style={styles.helperText}>{t('auth.loginAllowedOnly')}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              {t('auth.noAccount')}{' '}
              <Text style={styles.registerStrong}>{t('auth.registerNow')}</Text>
            </Text>
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
      paddingTop: 16,
      width: '100%',
      maxWidth: layout.formMaxWidth,
      alignSelf: 'center',
      flexGrow: 1,
      paddingHorizontal: layout.screenPadding,
      justifyContent: 'flex-start',
      gap: 14,
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
    header: {
      paddingVertical: 16,
      gap: 14,
    } as ViewStyle,
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    } as TextStyle,
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    } as TextStyle,
    form: {
      paddingVertical: 8,
    } as ViewStyle,
    formControl: {
      minHeight: 52,
      width: '100%',
    } as TextStyle,
    rememberRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,
    rememberText: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    } as TextStyle,
    formControlButton: {
      minHeight: 54,
      width: '100%',
    } as ViewStyle,
    spacer20: {
      height: 20,
    } as ViewStyle,
    spacer16: {
      height: 16,
    } as ViewStyle,
    spacer12: {
      height: 12,
    } as ViewStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginTop: 10,
    } as TextStyle,
    helperText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    } as TextStyle,
    footer: {
      marginTop: 'auto' as const,
      paddingTop: 10,
      alignItems: 'center',
      gap: 12,
    } as ViewStyle,
    registerLink: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    } as ViewStyle,
    registerText: {
      fontSize: 14,
      color: colors.textSecondary,
    } as TextStyle,
    registerStrong: {
      color: colors.primaryText,
      fontWeight: '600',
    } as TextStyle,
    textLink: {
      minHeight: 44,
      justifyContent: 'center',
    } as ViewStyle,
  });
