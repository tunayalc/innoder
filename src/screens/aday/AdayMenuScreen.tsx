import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { colors } from '../../theme';
import { MenuItem } from '../../components';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Aday ekranları</Text>
      <Text style={styles.subtitle}>Kullanıcı tarafındaki temel adımlar.</Text>
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
        onPress={() => navigation.navigate('AdayMesaj', {})} 
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
  } as TextStyle,
});
