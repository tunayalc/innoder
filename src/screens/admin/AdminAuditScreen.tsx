import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';

export const AdminAuditScreen: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Audit Log</Text>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:12] USER_REGISTERED #102</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:22] DOCUMENT_UPLOADED #901</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:40] ADMIN_VERIFIED #901</Text>
      </View>
      <View style={styles.logItem}>
        <Text style={styles.bodyText}>[2026-01-21 10:41] MESSAGE_SENT #555</Text>
      </View>
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
  logItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
});
