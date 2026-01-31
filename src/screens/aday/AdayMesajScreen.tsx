import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button } from '../../components';

export const AdayMesajScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Mesajlaşma</Text>
      <View style={styles.msgAdmin}>
        <Text style={styles.bodyText}>
          Kimlik belgesi eksik. Lütfen yeniden yükleyiniz.
        </Text>
      </View>
      <View style={styles.msgUser}>
        <Text style={styles.bodyText}>Bugün tekrar göndereceğim.</Text>
      </View>
      <View style={styles.msgAdmin}>
        <Text style={styles.bodyText}>Belge bulanık. OKUNMADI verdik.</Text>
      </View>
      <Button label="Mesaj Gönder" />
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
  msgAdmin: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.msgAdmin,
  } as ViewStyle,
  msgUser: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.msgUser,
    alignSelf: 'flex-end',
  } as ViewStyle,
});
