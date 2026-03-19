import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { RootStackParamList } from '../types';
import { LogoutButton, ThemeSwitcher } from '../components';
import { useAuth } from '../hooks';
import { useI18n } from '../i18n';
import { useAppDispatch } from '../store/hooks';
import { hydrateSession } from '../store/thunks/sessionThunks';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';
import {
  OnboardingIntroScreen,
  LoginScreen,
  RegisterScreen,
  AdminLoginScreen,
} from '../screens/auth';
import { HomeScreen } from '../screens/home';
import {
  AdayMenuScreen,
  AdayKayitScreen,
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
  AdminListeScreen,
  AdminDetayScreen,
  AdminDogrulamaScreen,
  AdminAuditScreen,
  DocumentViewerScreen,
} from '../screens/admin';
import { DataModelScreen } from '../screens/data';

const Stack = createStackNavigator<RootStackParamList>();

const AuthenticatedHeaderActions: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.headerActions}>
      <ThemeSwitcher compact />
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
  const lastHydratedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (lastHydratedUserId.current === user.id) return;
    lastHydratedUserId.current = user.id;
    dispatch(hydrateSession(user));
  }, [dispatch, isAuthenticated, user]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.textPrimary,
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ headerShown: false }} />
        </>
      ) : isAdmin ? (
        <>
          <Stack.Screen name="AdminListe" component={AdminListeScreen} options={{ title: t('adminList.title'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdminDetay" component={AdminDetayScreen} options={{ title: t('nav.applicationDetail'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdminDogrulama" component={AdminDogrulamaScreen} options={{ title: t('nav.verificationDecision'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdminAudit" component={AdminAuditScreen} options={{ title: t('common.auditLog'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: t('nav.documentViewer'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayMesaj" component={AdayMesajScreen} options={{ title: t('nav.messaging'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="Main" component={HomeScreen} options={{ title: t('common.appName'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="DataModel" component={DataModelScreen} options={{ title: t('nav.dataModel'), headerRight: renderAuthenticatedHeaderRight }} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdayMenu" component={AdayMenuScreen} options={{ title: t('common.appName'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayKayit" component={AdayKayitScreen} options={{ title: t('nav.registrationForm'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayEgitim" component={AdayEgitimScreen} options={{ title: t('nav.myPrograms'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayProgramDetay" component={AdayProgramDetayScreen} options={{ title: t('nav.programDetail'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayKisisel" component={AdayKisiselScreen} options={{ title: t('nav.personalInfo'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayCvBuilder" component={AdayCvBuilderScreen} options={{ title: t('nav.europassCv'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayMotivation" component={AdayMotivationScreen} options={{ title: t('nav.motivationLetter'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="AdayBelge" component={AdayBelgeScreen} options={{ title: t('nav.documentScan'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="BelgeCamera" component={BelgeCameraScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdayMesaj" component={AdayMesajScreen} options={{ title: t('nav.messaging'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: t('nav.documentViewer'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="Main" component={HomeScreen} options={{ title: t('common.appName'), headerRight: renderAuthenticatedHeaderRight }} />
          <Stack.Screen name="DataModel" component={DataModelScreen} options={{ title: t('nav.dataModel'), headerRight: renderAuthenticatedHeaderRight }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const createStyles = (_colors: AppColors) =>
  StyleSheet.create({
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: 12,
    } as ViewStyle,
  });


