import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';
import { BackButton, LogoutButton } from '../components';
import { useAuth } from '../hooks';
import { useAppDispatch } from '../store/hooks';
import { hydrateSession } from '../store/thunks/sessionThunks';

// Screens
import { OnboardingIntroScreen, LoginScreen, AdminLoginScreen } from '../screens/auth';
import { HomeScreen } from '../screens/home';
import {
  AdayMenuScreen,
  AdayKayitScreen,
  AdayEgitimScreen,
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

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: colors.primaryDark,
  headerTitleStyle: {
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  headerBackTitleVisible: false,
  headerLeft: (props: { canGoBack?: boolean }) =>
    (props.canGoBack ? <BackButton /> : null),
  cardStyle: {
    backgroundColor: colors.background,
  },
};

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const lastHydratedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (lastHydratedUserId.current === user.id) return;
    lastHydratedUserId.current = user.id;
    dispatch(hydrateSession(user));
  }, [dispatch, isAuthenticated, user]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
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
            name="AdminLogin"
            component={AdminLoginScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : isAdmin ? (
        <>
          <Stack.Screen
            name="AdminListe"
            component={AdminListeScreen}
            options={{ title: 'Basvuru Listesi', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdminDetay"
            component={AdminDetayScreen}
            options={{ title: 'Basvuru Detayi', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdminDogrulama"
            component={AdminDogrulamaScreen}
            options={{ title: 'Dogrulama Karari', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdminAudit"
            component={AdminAuditScreen}
            options={{ title: 'Audit Log', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ title: 'Belge Goruntuleme', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{ title: 'Mesajlasma', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{ title: 'Inno Prototype', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{ title: 'Veri Modeli', headerRight: () => <LogoutButton /> }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="AdayMenu"
            component={AdayMenuScreen}
            options={{ title: 'Aday Ekranlari', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayKayit"
            component={AdayKayitScreen}
            options={{ title: 'Kayit Formu', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayEgitim"
            component={AdayEgitimScreen}
            options={{ title: 'Egitim Bilgilendirme', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayKisisel"
            component={AdayKisiselScreen}
            options={{ title: 'Kisisel Bilgi', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayCvBuilder"
            component={AdayCvBuilderScreen}
            options={{ title: 'Europass CV', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayMotivation"
            component={AdayMotivationScreen}
            options={{ title: 'Motivasyon Mektubu', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="AdayBelge"
            component={AdayBelgeScreen}
            options={{ title: 'Belge Tarama', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="BelgeCamera"
            component={BelgeCameraScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{ title: 'Mesajlasma', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ title: 'Belge Goruntuleme', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{ title: 'Inno Prototype', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{ title: 'Veri Modeli', headerRight: () => <LogoutButton /> }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
