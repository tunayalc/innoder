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
import { colors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationLoading, selectApplications } from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { RootStackNavigationProp } from '../../types';
import { hydrateSession } from '../../store/thunks/sessionThunks';

export const AdayEgitimScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);

  const myPrograms = useMemo(
    () => applications.filter((app) => app.userId === user?.id),
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
          <Text style={styles.h2}>Programlarim</Text>
          <Text style={styles.subtitle}>
            Admin tarafindan atanmis tum programlarinizi bu alandan yonetebilirsiniz.
          </Text>
        </View>
      </View>

      <Button
        label={isLoading ? 'Yukleniyor...' : 'Programlari Yenile'}
        variant="ghost"
        onPress={() => user && dispatch(hydrateSession(user))}
      />

      {myPrograms.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Henuz size atanmis bir program yok. Lutfen admin atamasini bekleyin.
          </Text>
        </View>
      ) : (
        myPrograms.map((app) => {
          const totalDocs = app.documents.length;
          const completedDocs = app.documents.filter((d) => d.status === 'ok').length;

          return (
            <TouchableOpacity
              key={app.id}
              activeOpacity={0.8}
              style={styles.programCard}
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
                <Text style={styles.metaLabel}>Belge Ilerlemesi</Text>
                <Text style={styles.metaValue}>
                  {completedDocs}/{totalDocs}
                </Text>
              </View>

              <Text style={styles.cardHint}>Program detayina girerek motivasyon, belge ve checklist adimlarini yonetin.</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    gap: 8,
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
