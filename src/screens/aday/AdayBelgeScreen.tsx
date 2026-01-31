import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';
import { Button } from '../../components';

export const AdayBelgeScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Belge Tarama</Text>
      <View style={styles.scanBox}>
        <View style={styles.scanGuide} />
        <Text style={styles.bodyText}>Kamerayı hizala</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.bodyText}>Belge Tipi</Text>
        <Text style={styles.selectBox}>Kimlik / PDF</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.bodyText}>Kalite Kontrol</Text>
        <View style={styles.bars}>
          <View style={styles.barActive} />
          <View style={styles.barActive} />
          <View style={styles.barMuted} />
        </View>
      </View>
      <Button label="Yükle" />
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
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  scanBox: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.tealBorder,
    padding: 16,
    backgroundColor: colors.tealBg,
    gap: 8,
  } as ViewStyle,
  scanGuide: {
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
  } as ViewStyle,
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  selectBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tealDashed,
    color: colors.teal,
  } as TextStyle,
  bars: {
    flexDirection: 'row',
    gap: 4,
  } as ViewStyle,
  barActive: {
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
  } as ViewStyle,
  barMuted: {
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  } as ViewStyle,
});
