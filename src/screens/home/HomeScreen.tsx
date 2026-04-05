import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useI18n, getDocumentStatusLabel } from '../../i18n';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Card, Pill } from '../../components';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const styles = useThemedStyles(createStyles);
  const { t, language } = useI18n();

  return (
    <View style={styles.section}>
      <Text style={styles.h1}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <Card title={t('home.quickAccess')}>
        <Button
          label={t('home.candidateScreens')}
          onPress={() => navigation.navigate('AdayMenu')}
        />
        <Button
          label={t('home.adminScreens')}
          onPress={() => navigation.navigate('AdminListe')}
        />
        <Button
          label={t('home.dataModel')}
          onPress={() => navigation.navigate('DataModel')}
        />
      </Card>

      <Card title={t('home.summary')}>
        <Text style={styles.bodyText}>{t('home.step1')}</Text>
        <Text style={styles.bodyText}>{t('home.step2')}</Text>
        <Text style={styles.bodyText}>{t('home.step3')}</Text>
        <Text style={styles.bodyText}>{t('home.step4')}</Text>
        <Text style={styles.bodyText}>{t('home.step5')}</Text>
        <View style={styles.pillRow}>
          <Pill label={getDocumentStatusLabel('ok', language)} variant="ok" />
          <Pill label={getDocumentStatusLabel('missing', language)} variant="warn" />
          <Pill label={getDocumentStatusLabel('wrong_format', language)} variant="err" />
          <Pill label={getDocumentStatusLabel('unread', language)} variant="info" />
        </View>
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
    h1: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
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
