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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  ContactLinksCard,
  InputField,
  LanguageSwitcher,
  ThemeSwitcher,
} from '../../components';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { CONTACT_LINKS } from '../../constants';
import { openMailto } from '../../utils/contact';
import { isValidEmail } from '../../utils/validation';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Register'>>();
  const insets = useSafeAreaInsets();
  const { registerCandidate } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const styles = useThemedStyles(createStyles);
  const videosCompleted = Boolean(route.params?.videosCompleted);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false);

  const handleRegister = async () => {
    if (!videosCompleted) {
      Alert.alert(t('auth.videoRequiredTitle'), t('auth.videoRequiredText'));
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillNameEmail'));
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(t('common.errorTitle'), t('auth.validEmail'));
      return;
    }
    if (!kvkkAccepted) {
      Alert.alert(t('common.errorTitle'), t('auth.kvkkRequired'));
      return;
    }

    const result = await registerCandidate({ fullName, email, kvkkAccepted });
    if (result?.ok) {
      try {
        await openMailto({
          to: CONTACT_LINKS.email,
          subject: `${t('auth.passwordRequestButton')} - ${fullName.trim()}`,
          body:
            `${fullName.trim()} (${email.trim().toLowerCase()}) dogrulama ve giris icin sifre talep etti.`,
        });
      } catch {
        // Fall back to in-app confirmation when no mail app is available.
      }

      Alert.alert(t('auth.passwordRequestSuccessTitle'), result.message || t('auth.passwordRequestSuccessText'), [
        { text: t('auth.ok'), onPress: () => navigation.navigate('Login') },
      ]);
    }
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
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          {!videosCompleted ? <Text style={styles.warningText}>{t('auth.registerWarning')}</Text> : null}
          <Text style={styles.helperText}>{t('auth.registerPasswordInfo')}</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('auth.fullNamePlaceholder')}
            autoCapitalize="words"
          />
          <InputField
            label={t('auth.emailRequired')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.kvkkRow}>
          <View style={styles.kvkkTextWrap}>
            <Text style={styles.kvkkTitle}>{t('auth.kvkkTitle')}</Text>
            <Text style={styles.kvkkText}>{t('auth.kvkkText')}</Text>
          </View>
          <Switch
            value={kvkkAccepted}
            onValueChange={setKvkkAccepted}
            trackColor={{ false: colors.muted, true: colors.teal }}
            thumbColor={colors.white}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? t('auth.registerLoading') : t('auth.passwordRequestButton')}
          onPress={videosCompleted ? handleRegister : undefined}
        />

        <ContactLinksCard
          title={t('auth.contactTitle')}
          subtitle={t('auth.contactSubtitle')}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>{t('auth.backToLogin')}</Text>
        </TouchableOpacity>
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
    accentBar: { width: 28, height: 3, borderRadius: 2, backgroundColor: colors.primary } as ViewStyle,
    title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary } as TextStyle,
    warningText: { fontSize: 13, color: colors.noticeText } as TextStyle,
    helperText: { fontSize: 13, lineHeight: 20, color: colors.textSecondary } as TextStyle,
    form: { gap: 16 } as ViewStyle,
    kvkkRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,
    kvkkTextWrap: { flex: 1 } as ViewStyle,
    kvkkTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    kvkkText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 } as TextStyle,
    errorText: { fontSize: 13, color: colors.danger } as TextStyle,
    loginText: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 } as TextStyle,
  });

