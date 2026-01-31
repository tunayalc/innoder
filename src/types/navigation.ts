import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Root Stack Parameters
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: { screen?: keyof MainTabParamList };
  AdayKayit: undefined;
  AdayEgitim: undefined;
  AdayKisisel: undefined;
  AdayBelge: undefined;
  AdayMesaj: { applicationId?: string };
  AdminListe: undefined;
  AdminDetay: { applicationId: string };
  AdminDogrulama: { applicationId: string };
  AdminAudit: undefined;
  DataModel: undefined;
};

// Main Tab Parameters
export type MainTabParamList = {
  Home: undefined;
  AdayMenu: undefined;
  AdminMenu: undefined;
  Profile: undefined;
};

// Navigation Props
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// Screen Props
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type AdminDetayRouteProp = RouteProp<RootStackParamList, 'AdminDetay'>;
export type AdminDogrulamaRouteProp = RouteProp<RootStackParamList, 'AdminDogrulama'>;
export type AdayMesajRouteProp = RouteProp<RootStackParamList, 'AdayMesaj'>;

// Legacy support for existing screens
export type ScreenId =
  | 'home'
  | 'aday-menu'
  | 'admin-menu'
  | 'data-model'
  | 'aday-kayit'
  | 'aday-egitim'
  | 'aday-kisisel'
  | 'aday-belge'
  | 'aday-mesaj'
  | 'admin-liste'
  | 'admin-detay'
  | 'admin-dogrulama'
  | 'admin-audit';

export interface NavEntry {
  id: ScreenId;
  title: string;
}

export interface ScreenProps {
  push: (id: ScreenId, title: string) => void;
  pop: () => void;
  canGoBack: boolean;
  title: string;
}
