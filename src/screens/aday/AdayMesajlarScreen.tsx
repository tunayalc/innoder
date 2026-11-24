import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card, ContactLinksCard, FeatureRow, ScreenScrollView, SectionHeader } from '../../components';
import { useAuth } from '../../hooks';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { useThemedStyles, type AppColors } from '../../theme';
import type { RootStackNavigationProp } from '../../types';

// Inbox: one general thread with the association plus one thread per application.
export const AdayMesajlarScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { language } = useI18n();
  const en = language === 'en';
  const applications = useAppSelector(selectApplications);
  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(useCallback(() => setFocusTick(tick => tick + 1), []));
  const { unread, error } = useUnreadMessages(focusTick);

  const mine = useMemo(
    () =>
      applications
        .filter(application => application.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [applications, user?.id],
  );

  return (
    <ScreenScrollView safeTop inTabs contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>{en ? 'Messages' : 'Mesajlar'}</Text>
        <Text style={styles.subtitle}>
          {unread
            ? en
              ? `${unread} unread messages`
              : `${unread} okunmamış mesajın var`
            : en
            ? 'Write to the association privately. Replies appear here.'
            : 'Dernekle birebir yazış; yanıtlar burada görünür.'}
        </Text>
      </View>

      <Card>
        <FeatureRow
          icon="account-group-outline"
          title={en ? 'General conversation' : 'Genel yazışma'}
          description={en ? 'Questions that are not about one program' : 'Belirli bir programla ilgili olmayan sorular'}
          onPress={() => navigation.navigate('AdayMesaj')}
        />
      </Card>

      {mine.length ? (
        <>
          <SectionHeader title={en ? 'Program conversations' : 'Program yazışmaları'} />
          <Card>
            {mine.map((application, index) => (
              <View key={application.id} style={index ? styles.divided : undefined}>
                <FeatureRow
                  icon="school-outline"
                  tone="info"
                  title={application.programName}
                  description={en ? 'Documents, decisions and travel' : 'Belgeler, kararlar ve seyahat'}
                  onPress={() => navigation.navigate('AdayMesaj', { applicationId: application.id })}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text> : null}

      <ContactLinksCard
        title={en ? 'Other ways to reach us' : 'Diğer iletişim yolları'}
        subtitle={en ? 'E-mail and social media of the association' : 'Derneğin e-posta ve sosyal medya hesapları'}
      />
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { gap: 16, paddingBottom: 32 } as ViewStyle,
    header: { gap: 6 } as ViewStyle,
    title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 21, color: colors.textSecondary } as TextStyle,
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight } as ViewStyle,
  });
