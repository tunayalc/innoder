import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Pill, Button } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { setApplications } from '../../store/slices/applicationSlice';
import { setMessages } from '../../store/slices/messageSlice';
import { setLogs } from '../../store/slices/auditSlice';
import {
  createSeedApplications,
  createSeedMessages,
  createSeedAuditLogs,
} from '../../services/seedData';
import {
  APPLICATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '../../constants';
import { Application, ApplicationStatus, RootStackNavigationProp } from '../../types';

type FilterType = 'all' | ApplicationStatus;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'submitted', label: 'Gönderildi' },
  { key: 'under_review', label: 'İnceleniyor' },
  { key: 'needs_fix', label: 'Düzeltme' },
  { key: 'approved', label: 'Onaylı' },
];

const statusToVariant = (status: ApplicationStatus) => {
  switch (status) {
    case 'approved':
      return 'ok' as const;
    case 'needs_fix':
    case 'draft':
      return 'warn' as const;
    case 'rejected':
      return 'err' as const;
    default:
      return 'info' as const;
  }
};

export const AdminListeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Seed data if no applications exist
  useEffect(() => {
    if (applications.length === 0) {
      dispatch(setApplications(createSeedApplications()));
      dispatch(setMessages(createSeedMessages()));
      dispatch(setLogs(createSeedAuditLogs()));
    }
  }, []);

  const filteredApps = useMemo(() => {
    if (activeFilter === 'all') return applications;
    return applications.filter((app) => app.status === activeFilter);
  }, [applications, activeFilter]);

  const getSubtitle = useCallback((app: Application) => {
    const missingDocs = app.documents.filter(
      (d) => d.status !== 'ok',
    ).length;
    if (missingDocs === 0) return 'Tüm belgeler tamam';
    return `${missingDocs} belge eksik/hatalı`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Application }) => (
      <TouchableOpacity
        style={styles.listRow}
        onPress={() =>
          navigation.navigate('AdminDetay', { applicationId: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.personalInfo.fullName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowName}>{item.personalInfo.fullName}</Text>
          <Text style={styles.rowSubtitle}>
            {item.programName} · {getSubtitle(item)}
          </Text>
        </View>
        <Pill
          label={APPLICATION_STATUS_LABELS[item.status] || item.status}
          variant={statusToVariant(item.status)}
        />
      </TouchableOpacity>
    ),
    [navigation, getSubtitle],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h2}>Başvuru Listesi</Text>
        <Text style={styles.countText}>{applications.length} başvuru</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              activeFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bu filtreye uygun başvuru yok.</Text>
          </View>
        }
      />

      {/* Audit log shortcut */}
      <View style={styles.footer}>
        <Button
          label="Audit Log"
          variant="ghost"
          onPress={() => navigation.navigate('AdminAudit')}
        />
      </View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  } as ViewStyle,
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  } as ViewStyle,
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,
  filterTextActive: {
    color: colors.white,
  } as TextStyle,
  listContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 20,
  } as ViewStyle,
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  } as ViewStyle,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  } as TextStyle,
  rowContent: {
    flex: 1,
  } as ViewStyle,
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  rowSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  } as TextStyle,
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  } as TextStyle,
  footer: {
    padding: 16,
    paddingBottom: 28,
  } as ViewStyle,
});
