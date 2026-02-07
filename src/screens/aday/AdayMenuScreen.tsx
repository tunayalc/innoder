import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { colors } from '../../theme';
import { MenuItem, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const applications = useAppSelector(selectApplications);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const missingDocs = useMemo(() => {
    if (!myApplication) return 0;
    return myApplication.documents.filter((d) => d.status !== 'ok').length;
  }, [myApplication]);

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Hoş geldiniz, {user?.name || 'Aday'}</Text>
      <Text style={styles.subtitle}>Kullanıcı tarafındaki temel adımlar.</Text>

      {myApplication && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Başvuru Durumu</Text>
            <Pill
              label={APPLICATION_STATUS_LABELS[myApplication.status] || myApplication.status}
              variant={
                myApplication.status === 'approved'
                  ? 'ok'
                  : myApplication.status === 'needs_fix'
                    ? 'warn'
                    : myApplication.status === 'rejected'
                      ? 'err'
                      : 'info'
              }
            />
          </View>
          {missingDocs > 0 && (
            <Text style={styles.statusHint}>
              {missingDocs} belge eksik/hatalı
            </Text>
          )}
        </View>
      )}

      <MenuItem 
        label="Kayıt Formu" 
        onPress={() => navigation.navigate('AdayKayit')} 
      />
      <MenuItem 
        label="Eğitim Bilgilendirme" 
        onPress={() => navigation.navigate('AdayEgitim')} 
      />
      <MenuItem 
        label="Kişisel Bilgi Formu" 
        onPress={() => navigation.navigate('AdayKisisel')} 
      />
      <MenuItem 
        label="Belge Tarama / Yükleme" 
        onPress={() => navigation.navigate('AdayBelge')} 
      />
      <MenuItem 
        label="Mesajlaşma" 
        onPress={() => navigation.navigate('AdayMesaj', { applicationId: myApplication?.id })} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 4,
  } as TextStyle,
  statusCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    gap: 6,
  } as ViewStyle,
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  statusHint: {
    fontSize: 11,
    color: colors.noticeText,
  } as TextStyle,
});
