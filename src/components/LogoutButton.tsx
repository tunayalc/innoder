import React from 'react';
import { Alert, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../hooks';
import { useI18n } from '../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const handleLogout = () => {
    Alert.alert(t('common.logoutTitle'), t('common.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handleLogout}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="logout" size={20} color={colors.textSecondary} />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  } as ViewStyle,
});
