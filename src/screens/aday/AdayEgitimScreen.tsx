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
      <Text style={styles.h2}>Eğitim Bilgilendirme</Text>
      <Text style={styles.subtitle}>
        {myApplication
          ? `${myApplication.programName} / ${program?.year ?? 2026}`
          : 'Henüz başvuru yok'}
      </Text>

      {myApplication ? (
        <>
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
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} belge tamamlandı
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Katılım Adımları</Text>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Teslim Tarihleri</Text>
              {program.deadlines.map((d) => (
                <View key={d.label} style={styles.deadlineRow}>
                  <Text style={styles.deadlineLabel}>{d.label}</Text>
                  <Text style={styles.deadlineValue}>
                    {formatDateShort(d.dateISO)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gerekli Belgeler</Text>
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sık Yapılan Hatalar</Text>
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
    gap: 12,
    padding: 20,
    paddingBottom: 40,
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
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  } as TextStyle,
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    gap: 6,
  } as ViewStyle,
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  cardHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  stepText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  } as TextStyle,
  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  deadlineLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,
  deadlineValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});
