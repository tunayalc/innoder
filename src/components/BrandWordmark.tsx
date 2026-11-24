import React from 'react';
import { Image, StyleSheet } from 'react-native';

export const BrandWordmark = ({ compact = false }: { compact?: boolean }) => (
  <Image
    source={require('../assets/images/inno-wordmark.png')}
    accessibilityLabel="Inno Derneği"
    resizeMode="contain"
    style={[styles.logo, compact && styles.compact]}
  />
);

const styles = StyleSheet.create({
  logo: { width: 174, height: 80, backgroundColor: '#FFFFFF', borderRadius: 4 },
  compact: { width: 104, height: 44 },
});
