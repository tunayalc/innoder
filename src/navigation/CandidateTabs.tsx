import React, { useState } from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useI18n } from '../i18n';
import type { CandidateTabParamList } from '../types';
import {
  AdayEgitimScreen,
  AdayMenuScreen,
  AdayMesajlarScreen,
  AdayProfilScreen,
} from '../screens/aday';
import { createFloatingTabBar } from './FloatingTabBar';

const Tab = createBottomTabNavigator<CandidateTabParamList>();

const CandidateTabBar = createFloatingTabBar({
  AdayMenu: ['home-variant', 'home-variant-outline'],
  AdayEgitim: ['briefcase', 'briefcase-outline'],
  AdayMesajlar: ['message-text', 'message-text-outline'],
  AdayProfil: ['account-circle', 'account-circle-outline'],
});

const renderTabBar = (props: BottomTabBarProps) => <CandidateTabBar {...props} />;

export const CandidateTabs: React.FC = () => {
  const { language } = useI18n();
  const en = language === 'en';
  // Refresh the unread badge whenever a tab gains focus.
  const [focusTick, setFocusTick] = useState(0);
  const { unread } = useUnreadMessages(focusTick);

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}
      screenListeners={{ focus: () => setFocusTick(tick => tick + 1) }}
    >
      <Tab.Screen name="AdayMenu" component={AdayMenuScreen} options={{ title: en ? 'Home' : 'Ana sayfa' }} />
      <Tab.Screen name="AdayEgitim" component={AdayEgitimScreen} options={{ title: en ? 'Applications' : 'Başvurularım' }} />
      <Tab.Screen
        name="AdayMesajlar"
        component={AdayMesajlarScreen}
        options={{ title: en ? 'Messages' : 'Mesajlar', tabBarBadge: unread ? (unread > 9 ? '9+' : unread) : undefined }}
      />
      <Tab.Screen name="AdayProfil" component={AdayProfilScreen} options={{ title: en ? 'Profile' : 'Profil' }} />
    </Tab.Navigator>
  );
};
