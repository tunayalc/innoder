import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useThemedStyles, type AppColors } from '../../theme';
import { MenuItem } from '../../components';

export const AdminMenuScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Admin ekranları</Text>
      <Text style={styles.subtitle}>Liste, doğrulama ve audit akışıyla.</Text>
      <MenuItem 
        label='Başvuru Listesi' 
        onPress={() => navigation.navigate('AdminListe')} 
      />
      <MenuItem 
        label='Başvuru Detayı' 
        onPress={() => navigation.navigate('AdminDetay', { applicationId: '1' })} 
      />
      <MenuItem 
        label='Doğrulama Kararı' 
        onPress={() => navigation.navigate('AdminDogrulama', { applicationId: '1' })} 
      />
      <MenuItem 
        label="Audit Log" 
        onPress={() => navigation.navigate('AdminAudit')} 
      />
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    marginTop: 16,
    gap: 12,
    padding: 20,
  } as ViewStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  } as TextStyle,
});





