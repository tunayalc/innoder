import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useThemedStyles, type AppColors } from '../../theme';
import { useI18n } from '../../i18n';
import { MenuItem, ScreenScrollView } from '../../components';
import { useAuth } from '../../hooks';

export const AdminMenuScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <Text accessibilityRole="header" style={styles.h2}>{t('adminMenu.title')}</Text>
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
      {user?.role === 'super_admin' ? (
        <MenuItem
          label="Admin Yönetimi"
          subtitle="Yeni admin ekleyin ve yönetici erişimlerini düzenleyin"
          iconName="account-cog-outline"
          onPress={() => navigation.navigate('AdminManagement')}
        />
      ) : null}
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
      <MenuItem label="Mesajlar" subtitle="Genel ve başvuru konuşmaları" iconName="message-text-outline" onPress={()=>navigation.navigate('AdminOperations',{section:'messages'})}/>
      <MenuItem label="Hesap Silme Talepleri" subtitle="Anonimleştirme ve belge temizliği" iconName="account-remove-outline" onPress={()=>navigation.navigate('AdminOperations',{section:'deletions'})}/>
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: {
      gap: 12,
      padding: 20,
    } as ViewStyle,
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    } as TextStyle,
  });
