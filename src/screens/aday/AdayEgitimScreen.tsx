import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationLoading, selectApplications } from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { RootStackNavigationProp } from '../../types';
import { hydrateSession } from '../../store/thunks/sessionThunks';

export const AdayEgitimScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);

  const myPrograms = useMemo(
    () =>
      applications
        .filter((app) => app.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [applications, user?.id],
  );

  useEffect(() => {
    if (!user) return;
    if (myPrograms.length > 0) return;
    dispatch(hydrateSession(user));
  }, [dispatch, user, myPrograms.length]);

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.h2}>{t('candidatePrograms.title')}</Text>
          <Text style={styles.subtitle}>{t('candidatePrograms.subtitle')}</Text>
        </View>
      </View>

      <Button
        label={isLoading ? t('candidatePrograms.refreshing') : t('candidatePrograms.refresh')}
        variant="ghost"
        onPress={() => user && dispatch(hydrateSession(user))}
      />

      {myPrograms.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('candidatePrograms.empty')}</Text>
        </View>
      ) : (
        myPrograms.map((app) => {
          const totalDocs = app.documents.length;
          const completedDocs = app.documents.filter((d) => d.status === 'ok').length;

          return (
            <View key={app.id} style={styles.programCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.programCardMain}
                onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: app.id })}
              >
                <View style={styles.programTopRow}>
                  <Text style={styles.programTitle}>{app.programName}</Text>
                  <Pill
                    label={APPLICATION_STATUS_LABELS[app.status] || app.status}
                    variant={
                      app.status === 'approved'
                        ? 'ok'
                        : app.status === 'needs_fix'
                          ? 'warn'
                          : app.status === 'rejected'
                            ? 'err'
                            : 'info'
                    }
                  />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t('candidatePrograms.documentProgress')}</Text>
                  <Text style={styles.metaValue}>
                    {completedDocs}/{totalDocs}
                  </Text>
                </View>

                <Text style={styles.cardHint}>{t('candidatePrograms.cardHint')}</Text>
              </TouchableOpacity>

              <View style={styles.programActions}>
                <Button
                  label={t('candidatePrograms.detailButton')}
                  variant="ghost"
                  style={styles.programActionButton}
                  onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: app.id })}
                />
                <Button
                  label={t('candidatePrograms.messageButton')}
                  style={styles.programActionButton}
                  onPress={() => navigation.navigate('AdayMesaj', { applicationId: app.id })}
                />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    paddingTop: 16,
    gap: 14,
    padding: 20,
    paddingBottom: 40,
  } as ViewStyle,
  headerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  accentBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
  } as ViewStyle,
  headerContent: {
    flex: 1,
    gap: 6,
  } as ViewStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  programCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 12,
  } as ViewStyle,
  programCardMain: {
    gap: 8,
  } as ViewStyle,
  programActions: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  programActionButton: {
    flex: 1,
  } as ViewStyle,
  programTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  programTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  metaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  } as TextStyle,
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  cardHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});
