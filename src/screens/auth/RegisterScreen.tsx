import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { isValidEmail } from '../../utils/validation';
import { RootStackParamList } from '../../types';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Register'>>();
  const insets = useSafeAreaInsets();
  const { registerCandidate } = useAuth();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const videosCompleted = Boolean(route.params?.videosCompleted);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const handleRegister = async () => {
    if (!videosCompleted) {
      Alert.alert(
        'Video Zorunlulugu',
        'Kayit olmadan once bilgilendirme videolarinin tamamini izlemelisiniz.',
        [{ text: 'Videolara Don', onPress: () => navigation.navigate('OnboardingIntro') }],
      );
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Hata', 'Lutfen ad soyad ve e-posta alanlarini doldurun.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Hata', 'Gecerli bir e-posta giriniz.');
      return;
    }

    if (!kvkkAccepted) {
      Alert.alert('Hata', 'KVKK onayi zorunludur.');
      return;
    }

    const result = await registerCandidate({
      fullName,
      email,
      kvkkAccepted,
    });

    if (result?.ok) {
      Alert.alert(
        'Kayit alindi',
        result.message ||
          'Basvurunuz alindi. Tarafimizca paylasilan giris bilgileriyle daha sonra uygulamaya giris yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Kayit Ol</Text>
          <Text style={styles.subtitle}>
            Kayit olabilirsiniz. Uygulamaya sadece tarafimizca paylasilan giris
            bilgileri ile giris yapilabilir.
          </Text>
          {!videosCompleted ? (
            <Text style={styles.warningText}>
              Kayit icin once bilgilendirme videolarini tamamlayin.
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>
          <InputField
            label="Ad Soyad *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adiniz Soyadiniz"
            autoCapitalize="words"
          />

          <View style={{ height: 20 }} />

          <InputField
            label="E-posta *"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.kvkkWrap}>
          <View style={styles.kvkkRow}>
            <View style={styles.kvkkTextWrap}>
              <Text style={styles.kvkkTitle}>KVKK Acik Riza Onayi</Text>
              <Text style={styles.kvkkHint}>
                Kisisel verilerimin basvuru surecinin yonetimi, iletisim ve
                dogrulama amaciyla islenmesini kabul ediyorum.
              </Text>
            </View>
            <Switch
              value={kvkkAccepted}
              onValueChange={setKvkkAccepted}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ paddingHorizontal: 4, marginTop: 16 }}>
          <Button
            label={isLoading ? 'Kayit yapiliyor...' : 'Kayit Ol'}
            onPress={videosCompleted ? handleRegister : undefined}
          />
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Giris ekranina don: <Text style={styles.loginTextBold}>Giris Yap</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  } as ViewStyle,
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  } as ViewStyle,
  backBtnText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  header: {
    marginBottom: 30,
  } as ViewStyle,
  accentBar: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
    marginBottom: 16,
  } as ViewStyle,
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  } as TextStyle,
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,
  form: {
    paddingHorizontal: 0,
  } as ViewStyle,
  kvkkWrap: {
    marginTop: 20,
  } as ViewStyle,
  kvkkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  } as ViewStyle,
  kvkkTextWrap: {
    flex: 1,
  } as ViewStyle,
  kvkkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  kvkkHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  } as TextStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 12,
    paddingHorizontal: 4,
  } as TextStyle,
  warningText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.noticeText,
    lineHeight: 19,
  } as TextStyle,
  loginLink: {
    alignSelf: 'center',
    marginTop: 28,
    marginBottom: 16,
  } as ViewStyle,
  loginText: {
    fontSize: 15,
    color: colors.textSecondary,
  } as TextStyle,
  loginTextBold: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
});
