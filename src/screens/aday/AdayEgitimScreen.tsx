import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Pill, ProgressBar, ScreenScrollView, StateMessage } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import type { Application, PillVariant, RootStackNavigationProp } from '../../types';
import { documentProgress } from '../../utils/documentProgress';

const statusVariant = (application: Application): PillVariant =>
  application.decisionStatus === 'rejected'
    ? 'err'
    : application.status === 'returned_home'
    ? 'ok'
    : application.documents.some(document => document.status === 'wrong_format' || document.status === 'missing')
    ? 'warn'
    : 'info';

export const AdayEgitimScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const en = language === 'en';
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const myApplications = useMemo(
    () =>
      applications
        .filter(application => application.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [applications, user?.id],
  );

  return (
    <ScreenScrollView safeTop inTabs contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {en ? 'My applications' : 'Başvurularım'}
        </Text>
        <Text style={styles.subtitle}>
          {en
            ? 'Every program the association assigned to you, with its documents and dates.'
            : 'Derneğin sana atadığı programlar, belgeleri ve tarihleriyle burada.'}
        </Text>
      </View>

      {myApplications.length === 0 ? (
        <StateMessage
          kind={isLoading ? 'loading' : error ? 'error' : 'empty'}
          message={isLoading ? t('common.loading') : error || t('candidatePrograms.empty')}
        />
      ) : null}

      {myApplications.map(application => {
        const progress = documentProgress(application);
        const next = application.program.deadlines
          .filter(deadline => Date.parse(deadline.dateISO) >= Date.now() - 86400000)
          .sort((a, b) => Date.parse(a.dateISO) - Date.parse(b.dateISO))[0];
        const open = () => navigation.navigate('AdayProgramDetay', { applicationId: application.id });
        return (
          <View key={application.id} style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${application.programName}, ${getApplicationStatusLabel(application.status, language)}`}
              onPress={open}
              style={({ pressed }) => [styles.cover, pressed && styles.pressed]}
            >
              <View style={styles.coverMark}>
                <Icon
                  name={application.program.programKind === 'esc' ? 'hand-heart-outline' : 'earth'}
                  size={34}
                  color={colors.white}
                />
              </View>
              <Text style={styles.coverYear}>{application.program.year}</Text>
            </Pressable>
            <View style={styles.body}>
              <Pill label={getApplicationStatusLabel(application.status, language)} variant={statusVariant(application)} />
              <Text style={styles.cardTitle}>{application.programName}</Text>
              <View style={styles.metaRow}>
                <Icon name="file-check-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {en
                    ? `${progress.approved}/${progress.total} documents approved`
                    : `${progress.approved}/${progress.total} belge onaylandı`}
                </Text>
              </View>
              {next ? (
                <View style={styles.metaRow}>
                  <Icon name="calendar-clock" size={18} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {next.label} · {new Date(next.dateISO).toLocaleDateString(en ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' })}
                  </Text>
                </View>
              ) : null}
              <ProgressBar value={progress.approved} total={progress.total} label={t('candidateProgramDetail.documentProgress')} />
              <View style={styles.actions}>
                <Button label={en ? 'Open' : 'Aç'} size="sm" style={styles.action} onPress={open} />
                <Button
                  label={en ? 'Message' : 'Mesaj'}
                  size="sm"
                  variant="ghost"
                  icon="message-outline"
                  style={styles.action}
                  onPress={() => navigation.navigate('AdayMesaj', { applicationId: application.id })}
                />
              </View>
            </View>
          </View>
        );
      })}
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { gap: 18, paddingBottom: 32 } as ViewStyle,
    header: { gap: 6 } as ViewStyle,
    title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 21, color: colors.textSecondary } as TextStyle,
    card: {
      borderRadius: 18,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    } as ViewStyle,
    cover: {
      height: 120,
      backgroundColor: colors.heroBg,
      padding: 16,
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'flex-end',
    } as ViewStyle,
    coverMark: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    coverYear: { fontSize: 32, fontWeight: '700', color: colors.heroMuted } as TextStyle,
    pressed: { opacity: 0.88 } as ViewStyle,
    body: { padding: 16, gap: 10 } as ViewStyle,
    cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
    metaText: { flex: 1, fontSize: 15, color: colors.textSecondary } as TextStyle,
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 } as ViewStyle,
    action: { flex: 1 } as ViewStyle,
  });
