import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles, type AppColors } from '../../theme';
import { Card } from '../../components';

export const DataModelScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Veri Modeli</Text>
      <Text style={styles.subtitle}>
        Her ekranın ürettiği bilgi veritabanında karşılık bulur.
      </Text>
      <Card title="users">
        <Text style={styles.bodyText}>kimlik, iletişim, doğrulama, KVKK</Text>
      </Card>
      <Card title="applications">
        <Text style={styles.bodyText}>program, form verisi, başvuru durumu</Text>
      </Card>
      <Card title="documents">
        <Text style={styles.bodyText}>belge tipi, dosya, parse sonucu, status</Text>
      </Card>
      <Card title="messages">
        <Text style={styles.bodyText}>başvuruya bağlı mesajlaşma</Text>
      </Card>
      <Card title="audit_log">
        <Text style={styles.bodyText}>REGISTER / SUBMIT / UPLOAD / VERIFY</Text>
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
  h2: {
    fontSize: 20,
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
});




