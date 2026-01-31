import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { ListRow } from '../../components';

export const AdminListeScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Başvuru Listesi</Text>
      <ListRow 
        name="Aylin Demir" 
        subtitle="2 belge eksik" 
        label="NEEDS_FIX" 
        variant="warn" 
      />
      <ListRow 
        name="Kerem Kaya" 
        subtitle="Belge okunmadı" 
        label="OKUNMADI" 
        variant="info" 
      />
      <ListRow 
        name="Selin Bora" 
        subtitle="Hazır" 
        label="OK" 
        variant="ok" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});
