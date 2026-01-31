import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button, ChecklistRow } from '../../components';

export const AdayEgitimScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Eğitim Bilgilendirme</Text>
      <Text style={styles.subtitle}>Program A / 2026</Text>
      <ChecklistRow label="Kimlik Belgesi" status="EKSİK" variant="warn" />
      <ChecklistRow label="Başvuru Formu" status="OK" variant="ok" />
      <ChecklistRow label="Ek Belge" status="OKUNMADI" variant="info" />
      <Button label="Belge Örnekleri" variant="ghost" />
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  } as TextStyle,
});
