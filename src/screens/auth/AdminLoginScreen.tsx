import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, InputField, LanguageSwitcher, ThemeSwitcher } from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { useThemedStyles, type AppColors } from '../../theme';

export const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { loginAdmin } = useAuth();
  const { t } = useI18n();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleAdminLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Hata', t('auth.fillUsernamePassword'));
      return;
    }
    loginAdmin({ username, password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.headerControls}>
          <ThemeSwitcher compact />
          <LanguageSwitcher compact />
        </View>

        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{t('auth.adminTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.adminSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label={t('auth.username')}
            value={username}
            onChangeText={setUsername}
            placeholder={t('auth.usernamePlaceholder')}
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            label={isLoading ? t('auth.loginButtonLoading') : t('auth.loginButton')}
            onPress={handleAdminLogin}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, gap: 18 } as ViewStyle,
    backText: { color: colors.primary, fontSize: 16, fontWeight: '600' } as TextStyle,
    headerControls: { flexDirection: 'row', gap: 8, alignSelf: 'flex-start' } as ViewStyle,
    header: { gap: 10 } as ViewStyle,
    accentBar: { width: 28, height: 3, borderRadius: 2, backgroundColor: colors.teal } as ViewStyle,
    title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary } as TextStyle,
    form: { gap: 16 } as ViewStyle,
    errorText: { fontSize: 13, color: colors.danger } as TextStyle,
  });
