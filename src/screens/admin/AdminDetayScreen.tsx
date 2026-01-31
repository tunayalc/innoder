import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button, ChecklistRow } from '../../components';

export const AdminDetayScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Başvuru Detayı</Text>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <View>
          <Text style={styles.bodyText}>Aylin Demir</Text>
          <Text style={styles.subtitle}>Program A / 2026</Text>
        </View>
      </View>
      <ChecklistRow label="Kimlik Belgesi" status="EKSİK" variant="warn" />
      <ChecklistRow label="Başvuru Formu" status="OK" variant="ok" />
      <ChecklistRow label="Ek Belge" status="YANLIŞ FORMAT" variant="err" />
      <Button label="Doğrula / Mesaj Gönder" />
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  } as TextStyle,
  profileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  } as ViewStyle,
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    color: colors.white,
    fontWeight: '700',
  } as TextStyle,
});
