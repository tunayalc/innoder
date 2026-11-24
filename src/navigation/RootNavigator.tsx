import React, { useEffect, useRef, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, Platform, StyleSheet, View, ViewStyle } from 'react-native';
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
import { HomeScreen } from '../screens/home';
import {
  AdayMenuScreen,
  AdayEgitimScreen,
  AdayProgramDetayScreen,
  AdayKisiselScreen,
  AdayCvBuilderScreen,
  AdayMotivationScreen,
  AdayBelgeScreen,
  AdayMesajScreen,
  BelgeCameraScreen,
} from '../screens/aday';
import {
  AdminMenuScreen,
  AdminListeScreen,
  AdminDetayScreen,
  AdminDogrulamaScreen,
  AdminAuditScreen,
  AdminPasswordRequestsScreen,
  AdminProgramManagementScreen,
  AdminManagementScreen,
  DocumentViewerScreen,
} from '../screens/admin';
import { DataModelScreen } from '../screens/data';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AdminOperationsScreen } from '../screens/admin/AdminOperationsScreen';

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
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Oturum kontrol ediliyor"
        />
      </View>
    );

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
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
            name="AdminMenu"
            component={AdminMenuScreen}
            options={{
              title: t('common.appName'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminOperations"
            component={AdminOperationsScreen}
            options={({ route }) => ({
              title:
                route.params.section === 'messages'
                  ? 'Mesajlar'
                  : 'Hesap Silme Talepleri',
              headerRight: renderAuthenticatedHeaderRight,
            })}
          />
          <Stack.Screen
            name="AdminPasswordRequests"
            component={AdminPasswordRequestsScreen}
            options={{
              title: 'Şifre Talepleri',
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminProgramManagement"
            component={AdminProgramManagementScreen}
            options={{
              title: 'Program Yönetimi',
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminManagement"
            component={AdminManagementScreen}
            options={{
              title: 'Admin Yönetimi',
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminListe"
            component={AdminListeScreen}
            options={{
              title: t('adminList.title'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminDetay"
            component={AdminDetayScreen}
            options={{
              title: t('nav.applicationDetail'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminDogrulama"
            component={AdminDogrulamaScreen}
            options={{
              title: t('nav.verificationDecision'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdminAudit"
            component={AdminAuditScreen}
            options={{
              title: t('common.auditLog'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{
              title: t('nav.documentViewer'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{
              title: t('nav.messaging'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{
              title: t('common.appName'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{
              title: t('nav.dataModel'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Şifre Değişikliği',
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="AdayMenu"
            component={AdayMenuScreen}
            options={{
              title: t('common.appName'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayEgitim"
            component={AdayEgitimScreen}
            options={{
              title: t('nav.myPrograms'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayProgramDetay"
            component={AdayProgramDetayScreen}
            options={{
              title: t('nav.programDetail'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayKisisel"
            component={AdayKisiselScreen}
            options={{
              title: t('nav.personalInfo'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayCvBuilder"
            component={AdayCvBuilderScreen}
            options={{
              title: t('nav.europassCv'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayMotivation"
            component={AdayMotivationScreen}
            options={{
              title: t('nav.motivationLetter'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="AdayBelge"
            component={AdayBelgeScreen}
            options={{
              title: t('nav.documentScan'),
              headerRight: renderAuthenticatedHeaderRight,
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
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{
              title: t('nav.documentViewer'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{
              title: t('common.appName'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{
              title: t('nav.dataModel'),
              headerRight: renderAuthenticatedHeaderRight,
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Şifre Değişikliği',
              headerRight: renderAuthenticatedHeaderRight,
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
    restoring:{flex:1,justifyContent:'center',backgroundColor:colors.background} as ViewStyle,
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: 12,
    } as ViewStyle,
  });
