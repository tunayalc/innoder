import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { colors } from '../../theme';
import { Button, Card, Pill } from '../../components';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.section}>
      <Text style={styles.h1}>Aday ve Admin Akisi</Text>
      <Text style={styles.subtitle}>
        Bu prototipte aday akisi program atamasi odaklidir: once kisisel bilgiler,
        sonra Programlarim icinde program bazli belge/motivasyon adimlari.
      </Text>

      <Card title="Hizli Giris">
        <Button
          label="Aday Ekranlari"
          onPress={() => navigation.navigate('AdayMenu')}
        />
        <Button
          label="Admin Ekranlari"
          onPress={() => navigation.navigate('AdminListe')}
        />
        <Button
          label="Veri Modeli"
          onPress={() => navigation.navigate('DataModel')}
        />
      </Card>

      <Card title="Ozet Akis">
        <Text style={styles.bodyText}>1) Kayit (ad-soyad, e-posta, KVKK)</Text>
        <Text style={styles.bodyText}>2) Login (demo veya atanmis bilgiler)</Text>
        <Text style={styles.bodyText}>3) Kisisel Bilgiler (TC, pasaport, profil)</Text>
        <Text style={styles.bodyText}>4) Programlarim (admin atar)</Text>
        <Text style={styles.bodyText}>5) Program ici: motivasyon ve belgeler</Text>
        <Text style={styles.bodyText}>6) Program disi: CV ve mesajlar</Text>
        <View style={styles.pillRow}>
          <Pill label="OK" variant="ok" />
          <Pill label="EKSIK" variant="warn" />
          <Pill label="YANLIS FORMAT" variant="err" />
          <Pill label="OKUNMADI" variant="info" />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    gap: 12,
    padding: 20,
  } as ViewStyle,
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
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
});
