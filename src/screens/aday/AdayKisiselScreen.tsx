import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button, Field } from '../../components';

export const AdayKisiselScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Kişisel Bilgi</Text>
      <Field label="Program Seçimi" value="Program A" />
      <Field label="Doğum Tarihi" value="GG.AA.YYYY" />
      <Field label="Kimlik No" value="***********" />
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Form taslak olarak saklanır. Bağlantı gelince gönderilir.
        </Text>
      </View>
      <Button label="Başvuru Gönder" />
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
  notice: {
    backgroundColor: colors.noticeBg,
    padding: 12,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.noticeText,
    fontSize: 12,
  } as TextStyle,
});
