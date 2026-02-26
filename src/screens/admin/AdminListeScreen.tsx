import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Pill, Button } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { Application, ApplicationStatus, RootStackNavigationProp, User } from '../../types';
import { PROGRAM_CATALOG } from '../../services/programCatalog';
import {
  assignProgramToCandidate,
  loadAdminApplications,
} from '../../store/thunks/applicationThunks';
import { getBackend } from '../../services/backend';

type FilterType = 'all' | ApplicationStatus;
type ProgramFilter = 'all' | string;
type IssuesFilter = 'all' | 'issues' | 'no_issues';
type DateFilter = 'all' | '7d' | '30d';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tumu' },
  { key: 'submitted', label: 'Gonderildi' },
  { key: 'under_review', label: 'Inceleniyor' },
  { key: 'needs_fix', label: 'Duzeltme' },
  { key: 'approved', label: 'Onayli' },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'Tarih: Tumu' },
  { key: '7d', label: 'Son 7 gun' },
  { key: '30d', label: 'Son 30 gun' },
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
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [programFilter, setProgramFilter] = useState<ProgramFilter>('all');
  const [issuesFilter, setIssuesFilter] = useState<IssuesFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [query, setQuery] = useState('');

  const [candidatePool, setCandidatePool] = useState<User[]>([]);
  const [candidatePoolError, setCandidatePoolError] = useState<string | null>(null);
  const [isCandidatePoolLoading, setIsCandidatePoolLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState(PROGRAM_CATALOG[0]?.id || '');

  const loadCandidatePool = useCallback(async () => {
    setIsCandidatePoolLoading(true);
    setCandidatePoolError(null);
    try {
      const backend = getBackend();
      const candidates = await backend.auth.listCandidates();
      setCandidatePool(candidates);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Aday listesi yuklenemedi.';
      setCandidatePoolError(message);
    } finally {
      setIsCandidatePoolLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(loadAdminApplications());
    loadCandidatePool();
  }, [dispatch, loadCandidatePool]);

  const assignedCandidateIds = useMemo(
    () => new Set(applications.map((app) => app.userId)),
    [applications],
  );

  const unassignedCandidates = useMemo(
    () => candidatePool.filter((candidate) => !assignedCandidateIds.has(candidate.id)),
    [candidatePool, assignedCandidateIds],
  );

  useEffect(() => {
    if (unassignedCandidates.length === 0) {
      setSelectedCandidateId('');
      return;
    }

    const hasSelected = unassignedCandidates.some((c) => c.id === selectedCandidateId);
    if (!hasSelected) {
      setSelectedCandidateId(unassignedCandidates[0].id);
    }
  }, [selectedCandidateId, unassignedCandidates]);

  const filteredApps = useMemo(() => {
    let apps = applications;

    if (activeFilter !== 'all') {
      apps = apps.filter((app) => app.status === activeFilter);
    }

    if (programFilter !== 'all') {
      apps = apps.filter((app) => app.programId === programFilter);
    }

    if (issuesFilter !== 'all') {
      const wantIssues = issuesFilter === 'issues';
      apps = apps.filter((app) => {
        const hasIssues = app.documents.some((d) => d.status !== 'ok');
        return wantIssues ? hasIssues : !hasIssues;
      });
    }

    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : 30;
      const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
      apps = apps.filter((app) => new Date(app.createdAt).getTime() >= threshold);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      apps = apps.filter((app) => {
        const name = app.personalInfo.fullName.toLowerCase();
        return (
          name.includes(q) ||
          app.id.toLowerCase().includes(q) ||
          app.programName.toLowerCase().includes(q)
        );
      });
    }

    return apps;
  }, [applications, activeFilter, programFilter, issuesFilter, dateFilter, query]);

  const getSubtitle = useCallback((app: Application) => {
    const missingDocs = app.documents.filter((d) => d.status !== 'ok').length;
    if (missingDocs === 0) return 'Tum belgeler tamam';
    return `${missingDocs} belge eksik/hatali`;
  }, []);

  const handleAssign = useCallback(() => {
    if (!selectedCandidateId || !selectedProgramId) return;

    const candidate = unassignedCandidates.find((c) => c.id === selectedCandidateId);
    const program = PROGRAM_CATALOG.find((p) => p.id === selectedProgramId);
    if (!candidate || !program) return;

    Alert.alert(
      'Program Atama',
      `${candidate.name} icin ${program.name} atamasi yapilsin mi?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Ata',
          onPress: async () => {
            await dispatch(
              assignProgramToCandidate({
                userId: candidate.id,
                fullName: candidate.name,
                programId: selectedProgramId,
              }),
            );
            dispatch(loadAdminApplications());
            loadCandidatePool();
          },
        },
      ],
    );
  }, [dispatch, loadCandidatePool, selectedCandidateId, selectedProgramId, unassignedCandidates]);

  const renderItem = useCallback(
    ({ item }: { item: Application }) => (
      <TouchableOpacity
        style={styles.listRow}
        onPress={() => navigation.navigate('AdminDetay', { applicationId: item.id })}
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
            {item.programName} - {getSubtitle(item)}
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
        <Text style={styles.h2}>Basvuru Listesi</Text>
        <Text style={styles.countText}>
          {filteredApps.length}/{applications.length} basvuru
        </Text>
      </View>

      <View style={styles.assignCard}>
        <Text style={styles.assignTitle}>Program Atama (Atanmamis Adaylar)</Text>
        <Text style={styles.assignHint}>
          Kayit olan ancak henuz programa atanmamis adaylar burada gorunur.
        </Text>

        {candidatePoolError ? <Text style={styles.errorText}>{candidatePoolError}</Text> : null}

        {isCandidatePoolLoading ? (
          <Text style={styles.mutedText}>Aday listesi yukleniyor...</Text>
        ) : unassignedCandidates.length === 0 ? (
          <Text style={styles.mutedText}>Atama bekleyen aday yok.</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignRow}>
              {unassignedCandidates.map((candidate) => {
                const isActive = candidate.id === selectedCandidateId;
                return (
                  <TouchableOpacity
                    key={candidate.id}
                    style={[styles.assignChip, isActive && styles.assignChipActive]}
                    onPress={() => setSelectedCandidateId(candidate.id)}
                  >
                    <Text style={[styles.assignChipText, isActive && styles.assignChipTextActive]}>
                      {candidate.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignRow}>
              {PROGRAM_CATALOG.map((program) => {
                const isActive = program.id === selectedProgramId;
                return (
                  <TouchableOpacity
                    key={program.id}
                    style={[styles.assignChip, isActive && styles.assignChipActive]}
                    onPress={() => setSelectedProgramId(program.id)}
                  >
                    <Text style={[styles.assignChipText, isActive && styles.assignChipTextActive]}>
                      {program.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              label={isLoading ? 'Isleniyor...' : 'Secili Adaya Program Ata'}
              onPress={handleAssign}
              variant="ghost"
            />
          </>
        )}
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ara: isim, program, basvuru id"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            dispatch(loadAdminApplications());
            loadCandidatePool();
          }}
          disabled={isLoading}
        >
          <Text style={styles.refreshText}>{isLoading ? '...' : 'Yenile'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {PROGRAM_CATALOG.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.filterChip, programFilter === p.id && styles.filterChipActive]}
            onPress={() => setProgramFilter(programFilter === p.id ? 'all' : p.id)}
          >
            <Text style={[styles.filterText, programFilter === p.id && styles.filterTextActive]}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {[
          { key: 'all' as const, label: 'Belge: Tumu' },
          { key: 'issues' as const, label: 'Eksik/Hatali Var' },
          { key: 'no_issues' as const, label: 'Tamam' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, issuesFilter === f.key && styles.filterChipActive]}
            onPress={() => setIssuesFilter(f.key)}
          >
            <Text style={[styles.filterText, issuesFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {DATE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, dateFilter === f.key && styles.filterChipActive]}
            onPress={() => setDateFilter(f.key)}
          >
            <Text style={[styles.filterText, dateFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Yukleniyor...' : error ? error : 'Bu filtreye uygun basvuru yok.'}
            </Text>
          </View>
        }
      />

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
  assignCard: {
    marginTop: 12,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.cardBg,
    gap: 10,
  } as ViewStyle,
  assignTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  assignHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  assignRow: {
    gap: 8,
    paddingRight: 8,
  } as ViewStyle,
  assignChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.cardBg,
  } as ViewStyle,
  assignChipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealBg,
  } as ViewStyle,
  assignChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  } as TextStyle,
  assignChipTextActive: {
    color: colors.teal,
  } as TextStyle,
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  errorText: {
    fontSize: 12,
    color: '#DC2626',
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
    textAlign: 'center',
  } as TextStyle,
  footer: {
    padding: 16,
    paddingBottom: 28,
  } as ViewStyle,
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  } as TextStyle,
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  } as TextStyle,
});
