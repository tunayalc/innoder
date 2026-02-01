import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks';

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handleLogout}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon 
        name="logout" 
        size={20} 
        color={colors.textSecondary} 
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
