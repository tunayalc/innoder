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
      <Text style={styles.h1}>Tek kaynaklı başvuru akışı</Text>
      <Text style={styles.subtitle}>
        Bu prototip, aday ve admin akışlarını tıklanabilir bir şekilde gösteren
        basit bir mobil arayüzdür. Sadece görsel sunum amaçlıdır.
      </Text>

      <Card title="Hızlı Giriş">
        <Button 
          label="Aday Ekranları" 
          onPress={() => navigation.navigate('AdayKayit')} 
        />
        <Button 
          label="Admin Ekranları" 
          onPress={() => navigation.navigate('AdminListe')} 
        />
        <Button 
          label="Veri Modeli" 
          onPress={() => navigation.navigate('DataModel')} 
        />
      </Card>

      <Card title="Özet Akış">
        <Text style={styles.bodyText}>1) Kayıt ve iletişim doğrulama</Text>
        <Text style={styles.bodyText}>2) Program bilgilendirme + kontrol listesi</Text>
        <Text style={styles.bodyText}>3) Kişisel bilgi formu</Text>
        <Text style={styles.bodyText}>4) Belge tarama / yükleme</Text>
        <Text style={styles.bodyText}>5) Admin doğrulama + mesaj</Text>
        <View style={styles.pillRow}>
          <Pill label="OK" variant="ok" />
          <Pill label="EKSİK" variant="warn" />
          <Pill label="YANLIŞ FORMAT" variant="err" />
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
