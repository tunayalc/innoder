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
import { appConfig } from '../../config/appConfig';
import {
  Button,
  InputField,
  SettingsButton,
} from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectRememberMe, selectUserError, selectUserLoading } from '../../store/selectors';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { login, loginDemoCandidate, loginAdmin } = useAuth();
  const { t } = useI18n();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const rememberedPreference = useAppSelector(selectRememberMe);
  const isMockMode = appConfig.dataSource === 'mock';
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(rememberedPreference);

  React.useEffect(() => {
    setRememberMe(rememberedPreference);
  }, [rememberedPreference]);

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillIdentifierPassword'));
      return;
    }

    login({ identifier, password, rememberMe });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View pointerEvents="none" style={styles.topOrb} />
      <View pointerEvents="none" style={styles.bottomOrb} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnLabel}>{t('common.back')}</Text>
          </TouchableOpacity>

          <View style={styles.topControls}>
            <SettingsButton />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
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
            style={styles.formControl}
          />

          <View style={styles.spacer20} />

          <InputField
            label={t('common.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            style={styles.formControl}
          />

          <View style={styles.rememberRow}>
            <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.spacer16} />

          <Button
            label={isLoading ? t('auth.loginButtonLoading') : t('auth.loginButton')}
            onPress={handleLogin}
            style={styles.formControlButton}
            pressedOpacity={0.86}
          />

          <View style={styles.spacer12} />

          {isMockMode ? (
            <>
              <Button
                label={isLoading ? t('auth.demoButtonLoading') : t('auth.demoButton')}
                onPress={() => loginDemoCandidate(rememberMe)}
                variant="ghost"
                style={styles.demoButton}
                pressedOpacity={0.86}
              />
              <View style={styles.spacer12} />
              <Button
                label={t('auth.adminDemoButton')}
                onPress={() => loginAdmin({ username: 'admin', password: '123123', rememberMe })}
                variant="ghost"
                style={styles.demoButton}
                pressedOpacity={0.86}
              />
            </>
          ) : null}

          <View style={styles.spacer16} />
          <Text style={styles.helperText}>{t('auth.loginRoleHint')}</Text>
          <View style={styles.spacer12} />
          <Text style={styles.helperText}>{t('auth.loginAllowedOnly')}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
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
    topOrb: {
      position: 'absolute',
      top: -120,
      right: -40,
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: colors.orbOrange,
    } as ViewStyle,
    bottomOrb: {
      position: 'absolute',
      bottom: 40,
      left: -70,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: colors.tealLight,
    } as ViewStyle,
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
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
    backBtn: {
      alignSelf: 'flex-start',
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.rowBg,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    backBtnLabel: {
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '800',
    } as TextStyle,
    header: {
      marginBottom: 2,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
    } as ViewStyle,
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.6,
      marginBottom: 8,
    } as TextStyle,
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    } as TextStyle,
    form: {
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderRadius: 24,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
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
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    formControlButton: {
      minHeight: 54,
      width: '100%',
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    } as ViewStyle,
    demoButton: {
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
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
    } as TextStyle,
    footer: {
      marginTop: 'auto' as const,
      paddingTop: 10,
      alignItems: 'center',
      gap: 12,
    } as ViewStyle,
    registerLink: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    } as ViewStyle,
    registerText: {
      fontSize: 14,
      color: colors.textSecondary,
    } as TextStyle,
    registerStrong: {
      color: colors.primary,
      fontWeight: '800',
    } as TextStyle,
  });
