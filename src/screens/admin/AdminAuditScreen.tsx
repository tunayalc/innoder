import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
} from 'react-native';
import { colors } from '../../theme';
import { Pill } from '../../components';
import { useAppSelector } from '../../store/hooks';
import { selectAuditLogs } from '../../store/selectors/auditSelectors';
import { AUDIT_ACTIONS } from '../../constants';
import { formatDateTime } from '../../utils/date';
import { AuditLog, AuditAction } from '../../types';

const actionToVariant = (action: AuditAction) => {
  switch (action) {
    case 'USER_REGISTERED':
      return 'info' as const;
    case 'DOCUMENT_UPLOADED':
      return 'info' as const;
    case 'APPLICATION_SUBMITTED':
      return 'ok' as const;
    case 'ADMIN_VERIFIED':
      return 'ok' as const;
    case 'MESSAGE_SENT':
      return 'warn' as const;
    case 'STATUS_CHANGED':
      return 'err' as const;
    default:
      return 'info' as const;
  }
};

export const AdminAuditScreen: React.FC = () => {
  const logs = useAppSelector(selectAuditLogs);

  const sortedLogs = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [logs],
  );

  const renderItem = ({ item }: { item: AuditLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Pill
          label={AUDIT_ACTIONS[item.action] || item.action}
          variant={actionToVariant(item.action)}
        />
        <Text style={styles.logTime}>
          {formatDateTime(item.timestamp)}
        </Text>
      </View>
      {item.details && (
        <Text style={styles.logDetails}>{item.details}</Text>
      )}
      <Text style={styles.logMeta}>
        Kullanıcı: {item.userId} · Hedef: {item.targetId}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h2}>Audit Log</Text>
        <Text style={styles.countText}>{logs.length} kayıt</Text>
      </View>

      <FlatList
        data={sortedLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz audit log kaydı yok.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  } as ViewStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  countText: {
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  listContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 40,
  } as ViewStyle,
  logItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  } as ViewStyle,
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  logTime: {
    fontSize: 10,
    color: colors.textMuted,
  } as TextStyle,
  logDetails: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  } as TextStyle,
  logMeta: {
    fontSize: 10,
    color: colors.textMuted,
  } as TextStyle,
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  } as TextStyle,
});
