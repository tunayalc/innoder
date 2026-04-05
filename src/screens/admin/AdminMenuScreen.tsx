import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useThemedStyles, type AppColors } from '../../theme';
import { useI18n } from '../../i18n';
import { MenuItem } from '../../components';

export const AdminMenuScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { t } = useI18n();

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{t('adminMenu.title')}</Text>
      <Text style={styles.subtitle}>{t('adminMenu.subtitle')}</Text>
      <MenuItem
        label="Şifre Talepleri"
        subtitle="Şifre isteyen adayları ayrı ekrandan yönetin"
        iconName="lock-reset"
        onPress={() => navigation.navigate('AdminPasswordRequests')}
      />
      <MenuItem
        label="Program Yönetimi"
        subtitle="Adaya yeni program açma işlemlerini ayrı yönetin"
        iconName="folder-plus-outline"
        onPress={() => navigation.navigate('AdminProgramManagement')}
      />
      <MenuItem
        label="Başvuru Süreçleri"
        subtitle="Programa özel başvuruları ve belge süreçlerini görüntüleyin"
        iconName="clipboard-text-outline"
        onPress={() => navigation.navigate('AdminListe')}
      />
      <MenuItem
        label="Denetim Kaydı"
        subtitle="Tüm admin işlemlerinin kaydını inceleyin"
        iconName="file-document-outline"
        onPress={() => navigation.navigate('AdminAudit')}
      />
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
