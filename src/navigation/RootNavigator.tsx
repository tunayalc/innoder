import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';
import { BackButton, LogoutButton } from '../components';
import { useAuth } from '../hooks';

// Screens
import { LoginScreen, RegisterScreen, AdminLoginScreen } from '../screens/auth';
import { HomeScreen } from '../screens/home';
import { 
  AdayMenuScreen, 
  AdayKayitScreen,
  AdayEgitimScreen, 
  AdayKisiselScreen, 
  AdayBelgeScreen, 
  AdayMesajScreen 
} from '../screens/aday';
import { 
  AdminMenuScreen, 
  AdminListeScreen, 
  AdminDetayScreen, 
  AdminDogrulamaScreen, 
  AdminAuditScreen 
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
    props.canGoBack ? <BackButton /> : null,
  cardStyle: {
    backgroundColor: colors.background,
  },
};

const authenticatedScreenOptions = {
  ...screenOptions,
  headerRight: () => <LogoutButton />,
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        // Auth screens
        <>
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
            name="AdminLogin" 
            component={AdminLoginScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : isAdmin ? (
        // Admin screens - show admin list first
        <>
          <Stack.Screen 
            name="AdminListe" 
            component={AdminListeScreen}
            options={{ title: 'Başvuru Listesi', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdminDetay" 
            component={AdminDetayScreen}
            options={{ title: 'Başvuru Detayı', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdminDogrulama" 
            component={AdminDogrulamaScreen}
            options={{ title: 'Doğrulama Kararı', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdminAudit" 
            component={AdminAuditScreen}
            options={{ title: 'Audit Log', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayMesaj" 
            component={AdayMesajScreen}
            options={{ title: 'Mesajlaşma', headerRight: () => <LogoutButton /> }}
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
        // Candidate (Aday) screens - show aday menu first
        <>
          <Stack.Screen 
            name="AdayMenu" 
            component={AdayMenuScreen}
            options={{ title: 'Aday Ekranları', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayKayit" 
            component={AdayKayitScreen}
            options={{ title: 'Kayıt Formu', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayEgitim" 
            component={AdayEgitimScreen}
            options={{ title: 'Eğitim Bilgilendirme', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayKisisel" 
            component={AdayKisiselScreen}
            options={{ title: 'Kişisel Bilgi', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayBelge" 
            component={AdayBelgeScreen}
            options={{ title: 'Belge Tarama', headerRight: () => <LogoutButton /> }}
          />
          <Stack.Screen 
            name="AdayMesaj" 
            component={AdayMesajScreen}
            options={{ title: 'Mesajlaşma', headerRight: () => <LogoutButton /> }}
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
