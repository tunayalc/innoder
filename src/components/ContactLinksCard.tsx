import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { CONTACT_LINKS } from '../constants';
import { useI18n } from '../i18n';
import { useThemedStyles, type AppColors } from '../theme';
import { openExternalUrl, openMailto } from '../utils/contact';
import { Button } from './Button';
import { Card } from './Card';

interface ContactLinksCardProps {
  title: string;
  subtitle: string;
}

export const ContactLinksCard: React.FC<ContactLinksCardProps> = ({ title, subtitle }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  const handleEmail = async () => {
    try {
      await openMailto({
        to: CONTACT_LINKS.email,
        subject: t('auth.contactMailSubject'),
      });
    } catch {
      Alert.alert('Hata', t('auth.contactOpenError'));
    }
  };

  const handleInstagram = async () => {
    try {
      await openExternalUrl(CONTACT_LINKS.instagram);
    } catch {
      Alert.alert('Hata', t('auth.contactOpenError'));
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>E-posta</Text>
        <Text style={styles.infoValue}>{CONTACT_LINKS.email}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <Button label={t('auth.contactEmailButton')} variant="ghost" onPress={handleEmail} />
        <Button label={t('auth.contactInstagramButton')} variant="ghost" onPress={handleInstagram} />
      </View>
    </Card>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    header: {
      gap: 6,
      marginBottom: 4,
    } as ViewStyle,
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    infoBlock: {
      gap: 4,
      paddingVertical: 4,
    } as ViewStyle,
    infoLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    } as TextStyle,
    infoValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    } as TextStyle,
    buttonGroup: {
      gap: 10,
      marginTop: 4,
    } as ViewStyle,
  });
