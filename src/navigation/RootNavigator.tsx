import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';
import { BackButton } from '../components';

// Screens
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

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Main" 
        component={HomeScreen}
        options={{ title: 'Inno Prototype' }}
      />
      <Stack.Screen 
        name="AdayKayit" 
        component={AdayMenuScreen}
        options={{ title: 'Aday Ekranları' }}
      />
      <Stack.Screen 
        name="AdayEgitim" 
        component={AdayEgitimScreen}
        options={{ title: 'Eğitim Bilgilendirme' }}
      />
      <Stack.Screen 
        name="AdayKisisel" 
        component={AdayKisiselScreen}
        options={{ title: 'Kişisel Bilgi' }}
      />
      <Stack.Screen 
        name="AdayBelge" 
        component={AdayBelgeScreen}
        options={{ title: 'Belge Tarama' }}
      />
      <Stack.Screen 
        name="AdayMesaj" 
        component={AdayMesajScreen}
        options={{ title: 'Mesajlaşma' }}
      />
      <Stack.Screen 
        name="AdminListe" 
        component={AdminListeScreen}
        options={{ title: 'Başvuru Listesi' }}
      />
      <Stack.Screen 
        name="AdminDetay" 
        component={AdminDetayScreen}
        options={{ title: 'Başvuru Detayı' }}
      />
      <Stack.Screen 
        name="AdminDogrulama" 
        component={AdminDogrulamaScreen}
        options={{ title: 'Doğrulama Kararı' }}
      />
      <Stack.Screen 
        name="AdminAudit" 
        component={AdminAuditScreen}
        options={{ title: 'Audit Log' }}
      />
      <Stack.Screen 
        name="DataModel" 
        component={DataModelScreen}
        options={{ title: 'Veri Modeli' }}
      />
    </Stack.Navigator>
  );
};
