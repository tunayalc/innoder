import React, { useState } from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { appConfig } from '../config/appConfig';
import { apiClient, requireData } from '../services/api/apiClient';
import { useI18n } from '../i18n';
import type { AdminTabParamList } from '../types';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminListeScreen, AdminMenuScreen, AdminPasswordRequestsScreen } from '../screens/admin';
import { createFloatingTabBar } from './FloatingTabBar';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminTabBar = createFloatingTabBar({
  AdminHome: ['view-dashboard', 'view-dashboard-outline'],
  AdminListe: ['clipboard-text', 'clipboard-text-outline'],
  AdminOnaylar: ['account-check', 'account-check-outline'],
  AdminYonetim: ['cog', 'cog-outline'],
});
const renderTabBar = (props: BottomTabBarProps) => <AdminTabBar {...props} />;

export const AdminTabs: React.FC = () => {
  const { language } = useI18n();
  const en = language === 'en';
  // Badge the approvals tab with the number of candidates awaiting a link check.
  const [pending, setPending] = useState(0);
  const refreshPending = () => {
    if (appConfig.dataSource !== 'remote') return;
    apiClient
      .get<{ items: unknown[]; total: number }>('/admin/candidates?page=1&pageSize=1&status=pending')
      .then(response => setPending(requireData(response).total))
      .catch(() => undefined);
  };

  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }} screenListeners={{ focus: refreshPending }}>
      <Tab.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: en ? 'Home' : 'Ana sayfa' }} />
      <Tab.Screen name="AdminListe" component={AdminListeScreen} options={{ title: en ? 'Applications' : 'Başvurular' }} />
      <Tab.Screen
        name="AdminOnaylar"
        component={AdminPasswordRequestsScreen}
        options={{ title: en ? 'Approvals' : 'Onaylar', tabBarBadge: pending ? (pending > 9 ? '9+' : pending) : undefined }}
      />
      <Tab.Screen name="AdminYonetim" component={AdminMenuScreen} options={{ title: en ? 'Manage' : 'Yönetim' }} />
    </Tab.Navigator>
  );
};
