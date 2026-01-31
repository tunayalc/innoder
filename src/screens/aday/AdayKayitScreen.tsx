import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button, Field } from '../../components';

export const AdayKayitScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Kayıt Formu</Text>
      <Field label="Ad Soyad" value="Aylin Demir" />
      <Field label="E-posta" value="aylin@ornek.com" />
      <Field label="Telefon" value="+90 5xx xxx xx xx" />
      <View style={styles.switchRow}>
        <Text style={styles.bodyText}>KVKK Onayı</Text>
        <View style={styles.switchOn}>
          <View style={styles.switchDot} />
        </View>
      </View>
      <Button label="Hesap Oluştur" />
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.switchRowBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  } as ViewStyle,
  switchOn: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.teal,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  } as ViewStyle,
  switchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
  } as ViewStyle,
});
