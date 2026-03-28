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
const renderLogoutButton = () => <LogoutButton />;

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
  headerLeft: (props: { canGoBack?: boolean; tintColor?: string }) =>
    props.canGoBack ? <BackButton tintColor={props.tintColor} /> : null,
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
            options={{ title: 'Başvuru Listesi', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdminDetay"
            component={AdminDetayScreen}
            options={{ title: 'Başvuru Detayı', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdminDogrulama"
            component={AdminDogrulamaScreen}
            options={{ title: 'Doğrulama Kararı', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdminAudit"
            component={AdminAuditScreen}
            options={{ title: 'Denetim Kaydı', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ title: 'Belge Görüntüleme', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{ title: 'Mesajlaşma', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{ title: 'Inno Prototip', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{ title: 'Veri Modeli', headerRight: renderLogoutButton }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="AdayMenu"
            component={AdayMenuScreen}
            options={{ title: 'Aday Ekranları', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayKayit"
            component={AdayKayitScreen}
            options={{ title: 'Kayıt Formu', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayEgitim"
            component={AdayEgitimScreen}
            options={{ title: 'Eğitim Bilgilendirme', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayKisisel"
            component={AdayKisiselScreen}
            options={{ title: 'Kişisel Bilgi', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayCvBuilder"
            component={AdayCvBuilderScreen}
            options={{ title: 'Europass CV', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayMotivation"
            component={AdayMotivationScreen}
            options={{ title: 'Motivasyon Mektubu', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="AdayBelge"
            component={AdayBelgeScreen}
            options={{ title: 'Belge Tarama', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="BelgeCamera"
            component={BelgeCameraScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdayMesaj"
            component={AdayMesajScreen}
            options={{ title: 'Mesajlaşma', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ title: 'Belge Görüntüleme', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{ title: 'Inno Prototip', headerRight: renderLogoutButton }}
          />
          <Stack.Screen
            name="DataModel"
            component={DataModelScreen}
            options={{ title: 'Veri Modeli', headerRight: renderLogoutButton }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
