import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button, Pill } from '../../components';

export const AdminDogrulamaScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Doğrulama Kararı</Text>
      <View style={styles.previewBox} />
      <View style={styles.pillRow}>
        <Pill label="OK" variant="ok" />
        <Pill label="EKSİK" variant="warn" />
        <Pill label="YANLIŞ FORMAT" variant="err" />
        <Pill label="OKUNMADI" variant="info" />
      </View>
      <View style={styles.textArea}>
        <Text style={styles.bodyText}>Açıklama / not</Text>
      </View>
      <Button label="Durumu Kaydet" />
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
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  } as ViewStyle,
  previewBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.placeholder,
  } as ViewStyle,
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: 12,
  } as ViewStyle,
});
