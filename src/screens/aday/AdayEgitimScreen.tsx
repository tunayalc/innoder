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
          ? `${myApplication.programName} / 2026`
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
            <Text style={styles.cardTitle}>Gerekli Belgeler</Text>
            <Text style={styles.cardHint}>
              Aşağıdaki belgeleri eksiksiz yükleyin. EKSİK veya OKUNMADI durumunda
              Belge Tarama ekranından tekrar yükleyebilirsiniz.
            </Text>
          </View>

          {myApplication.documents.map((doc) => (
            <ChecklistRow
              key={doc.id}
              label={DOCUMENT_TYPES[doc.type] || doc.type}
              status={DOCUMENT_STATUS_LABELS[doc.status] || doc.status}
              variant={statusToVariant(doc.status)}
            />
          ))}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sık Yapılan Hatalar</Text>
            <Text style={styles.cardHint}>
              • Bulanık/karanlık fotoğraf → OKUNMADI{'\n'}
              • PDF yerine fotoğraf → YANLIŞ FORMAT{'\n'}
              • Eksik sayfa → EKSİK{'\n'}
              • Yanlış belge türü seçimi
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
