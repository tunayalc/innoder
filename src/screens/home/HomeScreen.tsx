import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Card, Pill } from '../../components';

export const HomeScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.section}>
      <Text style={styles.h1}>Aday ve Admin Akışı</Text>
      <Text style={styles.subtitle}>
        Bu prototipte aday akışı program ataması odaklıdır: önce kişisel bilgiler,
        sonra Programlarım içinde program bazlı belge/motivasyon adımları.
      </Text>

      <Card title="Hızlı Giriş">
        <Button
          label="Aday Ekranları"
          onPress={() => navigation.navigate('AdayMenu')}
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
        <Text style={styles.bodyText}>1) Kayıt (ad-soyad, e-posta, KVKK)</Text>
        <Text style={styles.bodyText}>2) Login (demo veya atanmış bilgiler)</Text>
        <Text style={styles.bodyText}>3) Kişisel Bilgiler (TC, pasaport, profil)</Text>
        <Text style={styles.bodyText}>4) Programlarım (admin atar)</Text>
        <Text style={styles.bodyText}>5) Program içi: motivasyon ve belgeler</Text>
        <Text style={styles.bodyText}>6) Program dışı: CV ve mesajlar</Text>
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

const createStyles = (colors: AppColors) => StyleSheet.create({
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


