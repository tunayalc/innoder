import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CONTACT_LINKS } from '../constants';
import { useI18n } from '../i18n';
import { useThemedStyles, type AppColors } from '../theme';
import { openExternalUrl, openMailto } from '../utils/contact';
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
      Alert.alert(t('common.errorTitle'), t('auth.contactOpenError'));
    }
  };

  const handleInstagram = async () => {
    try {
      await openExternalUrl(CONTACT_LINKS.instagram);
    } catch {
      Alert.alert(t('common.errorTitle'), t('auth.contactOpenError'));
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>{t('common.email')}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={CONTACT_LINKS.email} style={styles.emailLink} onPress={handleEmail}>
          <Text style={styles.infoValue}>{CONTACT_LINKS.email}</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity accessibilityRole="link" accessibilityLabel="Instagram" style={styles.instagramButton} onPress={handleInstagram}>
          <Icon name="instagram" size={22} color="#E1306C" />
        </TouchableOpacity>
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
    } as TextStyle,
    infoValue: {
      fontSize: 14,
      color: colors.primaryText,
      fontWeight: '700',
      textDecorationLine: 'underline',
    } as TextStyle,
    emailLink: {
      minHeight: 44,
      justifyContent: 'center',
    } as ViewStyle,
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 4,
    } as ViewStyle,
    instagramButton: {
      width: 44,
      height: 44,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
  });
