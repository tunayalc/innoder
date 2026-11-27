import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp, NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Root Stack Parameters
export type RootStackParamList = {
  OnboardingIntro: undefined;
  Login: undefined;
  Register: { videosCompleted: boolean } | undefined;
  ChangePassword: undefined;
  ForgotPassword: undefined;
  Splash: undefined;
  Auth: undefined;
  AdayTabs: NavigatorScreenParams<CandidateTabParamList> | undefined;
  AdayProgramDetay: { applicationId: string };
  AdayKisisel: undefined;
  AdayCvBuilder: { applicationId: string } | undefined;
  AdayMotivation: { applicationId: string } | undefined;
  AdayBelge: { applicationId: string; capturedPhotoUri?: string; docType?: string } | undefined;
  BelgeCamera: { docType: string; applicationId: string };
  AdayMesaj: { applicationId: string } | undefined;
  AdminTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  AdminProgramManagement: undefined;
  AdminManagement: undefined;
  AdminOperations: {section:'messages'|'deletions'};
  AdminDetay: { applicationId: string };
  AdminDogrulama: { applicationId: string; documentId?: string };
  AdminAudit: undefined;
  DocumentViewer: { applicationId: string; documentId?: string };
  Settings: undefined;
};

// Candidate bottom tabs
export type CandidateTabParamList = {
  AdayMenu: undefined;
  AdayEgitim: undefined;
  AdayMesajlar: undefined;
  AdayProfil: undefined;
};

// Admin bottom tabs
export type AdminTabParamList = {
  AdminHome: undefined;
  AdminListe: { issues?: boolean } | undefined;
  AdminOnaylar: undefined;
  AdminYonetim: undefined;
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
export type DocumentViewerRouteProp = RouteProp<RootStackParamList, 'DocumentViewer'>;
export type AdayMesajRouteProp = RouteProp<RootStackParamList, 'AdayMesaj'>;

// Legacy support for existing screens
export type ScreenId =
  | 'home'
  | 'aday-menu'
  | 'admin-menu'
  | 'data-model'
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
