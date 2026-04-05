import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles, type AppColors } from '../../theme';
import { useI18n } from '../../i18n';
import { Card } from '../../components';

export const DataModelScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{t('dataModel.title')}</Text>
      <Text style={styles.subtitle}>{t('dataModel.subtitle')}</Text>
      <Card title="users">
        <Text style={styles.bodyText}>{t('dataModel.users')}</Text>
      </Card>
      <Card title="applications">
        <Text style={styles.bodyText}>{t('dataModel.applications')}</Text>
      </Card>
      <Card title="documents">
        <Text style={styles.bodyText}>{t('dataModel.documents')}</Text>
      </Card>
      <Card title="messages">
        <Text style={styles.bodyText}>{t('dataModel.messages')}</Text>
      </Card>
      <Card title="audit_log">
        <Text style={styles.bodyText}>{t('dataModel.audit')}</Text>
      </Card>
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
    bodyText: {
      color: colors.textPrimary,
      fontSize: 13,
    } as TextStyle,
  });
