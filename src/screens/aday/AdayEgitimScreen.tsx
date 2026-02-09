import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, ChecklistRow } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPES } from '../../constants';
import { DocumentStatus, RootStackNavigationProp } from '../../types';
import { getProgramById } from '../../services/programCatalog';
import { formatDateShort } from '../../utils/date';

const statusToVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'ok':
      return 'ok';
    case 'missing':
      return 'warn';
    case 'wrong_format':
      return 'err';
    case 'unread':
      return 'info';
    default:
      return 'info';
  }
};

export const AdayEgitimScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const applications = useAppSelector(selectApplications);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const program = useMemo(
    () => (myApplication ? getProgramById(myApplication.programId) : null),
    [myApplication],
  );

  const completedCount = useMemo(
    () => myApplication?.documents.filter((d) => d.status === 'ok').length ?? 0,
    [myApplication],
  );
  const totalCount = myApplication?.documents.length ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.h2}>Eğitim Bilgilendirme</Text>
          <Text style={styles.subtitle}>
            {myApplication
              ? `${myApplication.programName} / ${program?.year ?? 2026}`
              : 'Henüz başvuru yok'}
          </Text>
        </View>
      </View>

      {myApplication ? (
        <>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Belge İlerlemesi</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      totalCount > 0
                        ? `${(completedCount / totalCount) * 100}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>KATILIM ADIMLARI</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              Program bazlı bilgilendirme ve checklist, yanlış anlamaları en başta azaltmak için tasarlanır.
            </Text>
          </View>

          {program?.steps?.length ? (
            <View style={styles.card}>
              {program.steps.map((s, idx) => (
                <Text key={`${idx}-${s}`} style={styles.stepText}>
                  {idx + 1}) {s}
                </Text>
              ))}
            </View>
          ) : null}

          {program?.deadlines?.length ? (
            <>
            <Text style={styles.sectionLabel}>TESLİM TARİHLERİ</Text>
            <View style={styles.card}>
              {program.deadlines.map((d) => (
                <View key={d.label} style={styles.deadlineRow}>
                  <Text style={styles.deadlineLabel}>{d.label}</Text>
                  <Text style={styles.deadlineValue}>
                    {formatDateShort(d.dateISO)}
                  </Text>
                </View>
              ))}
            </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>GEREKLİ BELGELER</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              Belge durumları server tarafı parse/doğrulama çıktısı olarak düşünülür:
              OK / EKSİK / YANLIŞ FORMAT / OKUNMADI.
            </Text>
          </View>

          {(program?.checklist || []).map((item) => {
            const doc = myApplication.documents.find((d) => d.type === item.documentType);
            const status = doc?.status || 'missing';
            return (
              <ChecklistRow
                key={item.documentType}
                label={DOCUMENT_TYPES[item.documentType] || item.documentType}
                hint={item.expectedFormat}
                status={DOCUMENT_STATUS_LABELS[status] || status}
                variant={statusToVariant(status as DocumentStatus)}
              />
            );
          })}

          <Text style={styles.sectionLabel}>DİKKAT EDİLMESİ GEREKENLER</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              {(program?.commonMistakes?.length
                ? program.commonMistakes
                : [
                    'Bulanık/karanlık fotoğraf → OKUNMADI',
                    'PDF yerine fotoğraf → YANLIŞ FORMAT',
                    'Eksik sayfa → EKSİK',
                    'Yanlış belge türü seçimi',
                  ]
              )
                .map((m) => `• ${m}`)
                .join('\\n')}
            </Text>
          </View>

          <Button
            label="Belge Yükle"
            onPress={() => navigation.navigate('AdayBelge')}
          />
          <Button
            label="Mesajları Görüntüle"
            variant="ghost"
            onPress={() =>
              navigation.navigate('AdayMesaj', {
                applicationId: myApplication.id,
              })
            }
          />
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Henüz bir başvurunuz bulunmuyor. Önce Kayıt Formu ekranından
            bilgilerinizi kaydedin.
          </Text>
          <Button
            label="Kayıt Formuna Git"
            onPress={() => navigation.navigate('AdayKayit')}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    gap: 16,
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
    gap: 4,
  } as ViewStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  } as TextStyle,
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 4,
  } as TextStyle,
  progressCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  } as TextStyle,
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.teal,
  } as ViewStyle,
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 8,
  } as ViewStyle,
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  cardHint: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  stepText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  } as TextStyle,
  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  deadlineLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,
  deadlineValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 24,
    gap: 18,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});
