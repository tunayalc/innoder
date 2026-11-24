import React, { useEffect, useRef, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, Image, ImageStyle, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { RootStackParamList } from '../types';
import { LogoutButton, SettingsButton } from '../components';
import { useAuth } from '../hooks';
import { useI18n } from '../i18n';
import { useAppDispatch } from '../store/hooks';
import { hydrateSession } from '../store/thunks/sessionThunks';
import { appConfig } from '../config/appConfig';
import { authService } from '../services/api/authService';
import { apiClient } from '../services/api/apiClient';
import { clearUser, setUser, setError } from '../store/slices/userSlice';
import { clearApplications } from '../store/slices/applicationSlice';
import { clearMessages } from '../store/slices/messageSlice';
import { clearLogs } from '../store/slices/auditSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_STORAGE_KEYS } from '../services/backend/mock/mockStorage';
import { clearPrivateFiles } from '../services/api/privateFiles';
import { fontFamily, useAppTheme, useThemedStyles, type AppColors } from '../theme';
import {
  OnboardingIntroScreen,
  LoginScreen,
  RegisterScreen,
  ChangePasswordScreen,
  ForgotPasswordScreen,
} from '../screens/auth';
import {
  AdayProgramDetayScreen,
  AdayKisiselScreen,
  AdayCvBuilderScreen,
  AdayMotivationScreen,
  AdayBelgeScreen,
  AdayMesajScreen,
  BelgeCameraScreen,
} from '../screens/aday';
import {
  AdminDetayScreen,
  AdminDogrulamaScreen,
  AdminAuditScreen,
  AdminProgramManagementScreen,
  AdminManagementScreen,
  DocumentViewerScreen,
} from '../screens/admin';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AdminOperationsScreen } from '../screens/admin/AdminOperationsScreen';
import { CandidateTabs } from './CandidateTabs';
import { AdminTabs } from './AdminTabs';

const Stack = createStackNavigator<RootStackParamList>();

const AuthenticatedHeaderActions: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.headerActions}>
      <SettingsButton />
      <LogoutButton />
    </View>
  );
};

const renderAuthenticatedHeaderRight = () => <AuthenticatedHeaderActions />;

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles=useThemedStyles(createStyles);
  const lastHydratedUserId = useRef<string | null>(null);
  const [restoring, setRestoring] = useState(appConfig.dataSource === 'remote');

  useEffect(() => {
    const unsubscribe = apiClient.onExpired(() => {
      dispatch(clearUser());
      dispatch(clearApplications());
      dispatch(clearMessages());
      dispatch(clearLogs());
      dispatch(setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'));
      clearPrivateFiles().catch(() => undefined);
    });
    let active = true;
    if (appConfig.dataSource === 'remote') {
      Promise.all([
        AsyncStorage.multiRemove(Object.values(MOCK_STORAGE_KEYS)),
        clearPrivateFiles(),
      ])
        .then(() => authService.restoreUser())
        .then(restored => {
          if (active && restored) dispatch(setUser(restored));
        })
        .catch(error => {
          if (active)
            dispatch(
              setError(
                error instanceof Error ? error.message : 'Oturum açılamadı.',
              ),
            );
        })
        .finally(() => {
          if (active) setRestoring(false);
        });
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      lastHydratedUserId.current = null;
      return;
    }
    if (user.mustChangePassword) return;
    if (lastHydratedUserId.current === user.id) return;
    lastHydratedUserId.current = user.id;
    dispatch(hydrateSession(user));
  }, [dispatch, isAuthenticated, user]);

  if (restoring)
    return (
      <View style={styles.restoring}>
        <Image
          source={require('../assets/images/inno-wordmark-white.png')}
          accessibilityLabel="Inno Derneği"
          resizeMode="contain"
          style={styles.splashLogo}
        />
        <ActivityIndicator
          color={colors.white}
          accessibilityLabel="Oturum kontrol ediliyor"
        />
      </View>
    );

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primaryDark,
        headerTitleStyle: {
          fontFamily: fontFamily.semibold,
          fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
          fontSize: 18,
          color: colors.textPrimary,
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="OnboardingIntro"
            component={OnboardingIntroScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Şifremi Unuttum' }}
          />
        </>
      ) : user?.mustChangePassword ? (
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            title: 'Şifre Değişikliği',
            headerRight: renderAuthenticatedHeaderRight,
          }}
        />
      ) : isAdmin ? (
        <>
          <Stack.Screen
            name="AdminTabs"
            component={AdminTabs}
            options={{ headerShown: false, title: t('common.appName') }}
          />
          <Stack.Screen
            name="AdminOperations"
            component={AdminOperationsScreen}
            options={({ route }) => ({
              title:
                route.params.section === 'messages'
                  ? 'Mesajlar'
                  : 'Hesap Silme Talepleri',
            })}
          />
          <Stack.Screen
            name="AdminProgramManagement"
            component={AdminProgramManagementScreen}
            options={{
              title: 'Program Yönetimi',
            }}
          />
          <Stack.Screen
            name="AdminManagement"
            component={AdminManagementScreen}
            options={{
              title: 'Admin Yönetimi',
            }}
          />
          <Stack.Screen
            name="AdminDetay"
            component={AdminDetayScreen}
            options={{
              title: t('nav.applicationDetail'),
            }}
          />
          <Stack.Screen
            name="AdminDogrulama"
            component={AdminDogrulamaScreen}
            options={{
              title: t('nav.verificationDecision'),
            }}
          />
          <Stack.Screen
            name="AdminAudit"
            component={AdminAuditScreen}
            options={{
              title: t('common.auditLog'),
            }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{
              title: t('nav.documentViewer'),
            }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{
              title: t('nav.messaging'),
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Şifre Değişikliği',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="AdayTabs"
            component={CandidateTabs}
            options={{ headerShown: false, title: t('common.appName') }}
          />
          <Stack.Screen
            name="AdayProgramDetay"
            component={AdayProgramDetayScreen}
            options={{
              title: t('nav.programDetail'),
            }}
          />
          <Stack.Screen
            name="AdayKisisel"
            component={AdayKisiselScreen}
            options={{
              title: t('nav.personalInfo'),
            }}
          />
          <Stack.Screen
            name="AdayCvBuilder"
            component={AdayCvBuilderScreen}
            options={{
              title: t('nav.europassCv'),
            }}
          />
          <Stack.Screen
            name="AdayMotivation"
            component={AdayMotivationScreen}
            options={{
              title: t('nav.motivationLetter'),
            }}
          />
          <Stack.Screen
            name="AdayBelge"
            component={AdayBelgeScreen}
            options={{
              title: t('nav.documentScan'),
            }}
          />
          <Stack.Screen
            name="BelgeCamera"
            component={BelgeCameraScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{
              title: t('nav.messaging'),
            }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{
              title: t('nav.documentViewer'),
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Şifre Değişikliği',
            }}
          />
        </>
      )}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('common.settings') }}
      />
    </Stack.Navigator>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    restoring: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28, backgroundColor: colors.brandRed } as ViewStyle,
    splashLogo: { width: 200, height: 76 } as ImageStyle,
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: 12,
    } as ViewStyle,
  });
