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
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handleLogout}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="logout-variant" size={22} color={colors.primary} />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  pressed: {
    opacity: 0.86,
  } as ViewStyle,
});
