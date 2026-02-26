import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { colors } from '../../theme';
import { MenuItem, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { isEuropassCvComplete } from '../../utils/europass';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const applications = useAppSelector(selectApplications);

  const myPrograms = useMemo(
    () => applications.filter((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const latestProgram = myPrograms[0];
  const missingDocs = useMemo(() => {
    if (!latestProgram) return 0;
    return latestProgram.documents.filter((d) => d.status !== 'ok').length;
  }, [latestProgram]);

  const totalDocs = latestProgram?.documents.length ?? 0;
  const completedDocs = totalDocs - missingDocs;

  const cvReady = isEuropassCvComplete(user?.europassCv);

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.greeting}>Merhaba, {user?.name || 'Aday'}</Text>

      <View style={styles.statusCard}>
        <View style={styles.statusAccent} />
        <View style={styles.statusContent}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Profil Ozeti</Text>
            <Pill
              label={cvReady ? 'CV Hazir' : 'CV Eksik'}
              variant={cvReady ? 'ok' : 'warn'}
            />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Program Atamasi:</Text>
            <Text style={styles.metaValue}>{myPrograms.length}</Text>
          </View>
          {latestProgram ? (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Son Program:</Text>
                <Text style={styles.metaValue}>{latestProgram.programName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Durum:</Text>
                <Text style={styles.metaValue}>
                  {APPLICATION_STATUS_LABELS[latestProgram.status] || latestProgram.status}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Belge Ilerlemesi:</Text>
                <Text style={styles.metaValue}>
                  {completedDocs}/{totalDocs}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.statusHint}>Admin program atamasi bekleniyor.</Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>ANA BLOK</Text>

      <MenuItem
        label="Kisisel Bilgiler"
        subtitle="TC Kimlik, pasaport ve profil bilgileri"
        iconName="account-edit-outline"
        iconColor={colors.primary}
        iconBg={colors.warning}
        onPress={() => navigation.navigate('AdayKisisel')}
      />

      <MenuItem
        label="Programlarim"
        subtitle="Admin tarafindan atanan programlar"
        iconName="view-list-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayEgitim')}
      />

      <MenuItem
        label="Mesajlar"
        subtitle="Programdan bagimsiz mesajlasma alani"
        iconName="message-text-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayMesaj')}
      />

      <MenuItem
        label="Europass CV"
        subtitle={cvReady ? 'CV formati tamamlandi' : 'CV profilinizi tamamlayin'}
        iconName="file-account-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayCvBuilder')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  } as ViewStyle,
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  statusCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 6,
  } as ViewStyle,
  statusAccent: {
    width: 4,
    backgroundColor: colors.teal,
  } as ViewStyle,
  statusContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
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
  statusHint: {
    fontSize: 13,
    color: colors.noticeText,
  } as TextStyle,
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  } as TextStyle,
});
