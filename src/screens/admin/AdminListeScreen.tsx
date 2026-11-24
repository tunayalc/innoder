import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  layout,
  useAppTheme,
  useThemedStyles,
  type AppColors,
} from '../../theme';
import { Pill, Button, StateMessage } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import {
  Application,
  ApplicationStatus,
  RootStackNavigationProp,
  AdminTabParamList,
} from '../../types';
import { PROGRAM_CATALOG } from '../../services/programCatalog';
import { loadAdminApplications } from '../../store/thunks/applicationThunks';
import { useI18n, getApplicationStatusLabel } from '../../i18n';
import { appConfig } from '../../config/appConfig';
import { getBackend } from '../../services/backend';
import type { AssignedProgram } from '../../types';

type FilterType = 'all' | ApplicationStatus;
type ProgramFilter = 'all' | string;
type IssuesFilter = 'all' | 'issues' | 'no_issues';
type DateFilter = 'all' | '7d' | '30d';

const statusToVariant = (status: ApplicationStatus) => {
  switch (status) {
    case 'returned_home':
      return 'ok' as const;
    case 'application_stage':
      return 'warn' as const;
    case 'erasmus_stage':
      return 'info' as const;
    default:
      return 'info' as const;
  }
};

export const AdminListeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const { t, language } = useI18n();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const pagination = useAppSelector(state => state.application);
  const [programs, setPrograms] = useState<AssignedProgram[]>(
    PROGRAM_CATALOG as unknown as AssignedProgram[],
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [programFilter, setProgramFilter] = useState<ProgramFilter>('all');
  const route = useRoute<RouteProp<AdminTabParamList, 'AdminListe'>>();
  const [issuesFilter, setIssuesFilter] = useState<IssuesFilter>('all');
  useEffect(() => {
    if (route.params?.issues) setIssuesFilter('issues');
  }, [route.params?.issues]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [query, setQuery] = useState('');
  const hasFilters =
    activeFilter !== 'all' ||
    programFilter !== 'all' ||
    issuesFilter !== 'all' ||
    dateFilter !== 'all' ||
    Boolean(query.trim());
  const resetFilters = () => {
    setActiveFilter('all');
    setProgramFilter('all');
    setIssuesFilter('all');
    setDateFilter('all');
    setQuery('');
  };

  const serverFilters = useMemo(
    () => ({
      status: activeFilter === 'all' ? undefined : activeFilter,
      programId: programFilter === 'all' ? undefined : programFilter,
      hasIssues: issuesFilter === 'all' ? undefined : issuesFilter === 'issues',
      createdAfterISO:
        dateFilter === 'all'
          ? undefined
          : new Date(
              Date.now() - (dateFilter === '7d' ? 7 : 30) * 86400000,
            ).toISOString(),
      query,
    }),
    [activeFilter, programFilter, issuesFilter, dateFilter, query],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(loadAdminApplications(serverFilters));
    }, 250);
    return () => clearTimeout(timer);
  }, [dispatch, serverFilters]);
  useEffect(() => {
    if (appConfig.dataSource === 'remote')
      getBackend()
        .programs.listPrograms()
        .then(setPrograms)
        .catch(() => undefined);
  }, []);

  const filters: { key: FilterType; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t('adminList.filters.all') },
      { key: 'application_stage', label: 'Başvuru Aşaması' },
      { key: 'erasmus_stage', label: 'Hareketlilik / Erasmus' },
      { key: 'returned_home', label: 'Ülkeye Dönüş Tamamlandı' },
    ],
    [t],
  );

  const dateFilters: { key: DateFilter; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t('adminList.filters.dateAll') },
      { key: '7d', label: t('adminList.filters.date7d') },
      { key: '30d', label: t('adminList.filters.date30d') },
    ],
    [t],
  );

  const issueFilters: { key: IssuesFilter; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t('adminList.filters.docsAll') },
      { key: 'issues', label: t('adminList.filters.docsIssues') },
      { key: 'no_issues', label: t('adminList.filters.docsComplete') },
    ],
    [t],
  );

  const filteredApps = useMemo(() => {
    if (appConfig.dataSource === 'remote') return applications;
    let apps = applications;

    if (activeFilter !== 'all') {
      apps = apps.filter(app => app.status === activeFilter);
    }

    if (programFilter !== 'all') {
      apps = apps.filter(app => app.programId === programFilter);
    }

    if (issuesFilter !== 'all') {
      const wantIssues = issuesFilter === 'issues';
      apps = apps.filter(app => {
        const hasIssues = app.documents.some(d => d.status !== 'ok');
        return wantIssues ? hasIssues : !hasIssues;
      });
    }

    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : 30;
      const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
      apps = apps.filter(app => new Date(app.createdAt).getTime() >= threshold);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      apps = apps.filter(app => {
        const name = app.personalInfo.fullName.toLowerCase();
        return (
          name.includes(q) ||
          app.id.toLowerCase().includes(q) ||
          app.programName.toLowerCase().includes(q)
        );
      });
    }

    return apps;
  }, [
    applications,
    activeFilter,
    programFilter,
    issuesFilter,
    dateFilter,
    query,
  ]);

  const getSubtitle = useCallback(
    (app: Application) => {
      const missingDocs = app.documents.filter(d => d.status !== 'ok').length;
      if (missingDocs === 0) return t('adminList.allDocumentsDone');
      return t('adminList.missingDocuments', { count: missingDocs });
    },
    [t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Application }) => (
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.listRow}
        onPress={() =>
          navigation.navigate('AdminDetay', { applicationId: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.personalInfo.fullName || '?')
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map(part => part[0]?.toLocaleUpperCase('tr-TR'))
              .join('')}
          </Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowName}>{item.personalInfo.fullName}</Text>
          <Text style={styles.rowSubtitle}>
            {item.programName} · {getSubtitle(item)}
          </Text>
          <Pill
            label={getApplicationStatusLabel(item.status, language)}
            variant={item.decisionStatus === 'rejected' ? 'err' : statusToVariant(item.status)}
          />
        </View>
        <Icon name="chevron-right" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    ),
    [navigation, getSubtitle, styles, language, colors.textMuted],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredApps}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        onEndReached={() => {
          if (pagination.hasMore && !isLoading)
            dispatch(
              loadAdminApplications({
                ...serverFilters,
                page: (pagination.page || 1) + 1,
                append: true,
              }),
            );
        }}
        onEndReachedThreshold={0.4}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 24 },
        ]}
        refreshing={isLoading}
        onRefresh={() => dispatch(loadAdminApplications())}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.h2}>
                {t('adminList.title')}
              </Text>
              <Text style={styles.countText}>
                {t('adminList.count', {
                  filtered: filteredApps.length,
                  total: applications.length,
                })}
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <View style={styles.searchBox}>
                <Icon name="magnify" size={22} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('adminList.searchPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={t('adminList.searchPlaceholder')}
                  accessibilityRole="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                style={styles.refreshBtn}
                accessibilityRole="button"
                accessibilityLabel={t('common.refresh')}
                accessibilityState={{ disabled: isLoading, busy: isLoading }}
                onPress={() => dispatch(loadAdminApplications())}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Icon name="refresh" size={22} color={colors.primaryText} />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
              {filters.map(f => (
                <TouchableOpacity
                  key={f.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: activeFilter === f.key }}
                  style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {programs.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
                {programs.map(p => (
                <TouchableOpacity
                  key={p.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: programFilter === p.id }}
                  style={[styles.filterChip, programFilter === p.id && styles.filterChipActive]}
                  onPress={() => setProgramFilter(programFilter === p.id ? 'all' : p.id)}
                >
                  <Text style={[styles.filterText, programFilter === p.id && styles.filterTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
              {issueFilters.map(f => (
                <TouchableOpacity
                  key={f.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: issuesFilter === f.key }}
                  style={[styles.filterChip, issuesFilter === f.key && styles.filterChipActive]}
                  onPress={() => setIssuesFilter(f.key)}
                >
                  <Text style={[styles.filterText, issuesFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.filterGap} />
              {dateFilters.map(f => (
                <TouchableOpacity
                  key={f.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: dateFilter === f.key }}
                  style={[styles.filterChip, dateFilter === f.key && styles.filterChipActive]}
                  onPress={() => setDateFilter(f.key)}
                >
                  <Text style={[styles.filterText, dateFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {hasFilters ? (
              <Button
                label={
                  language === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'
                }
                variant="ghost"
                onPress={resetFilters}
              />
            ) : null}
            {error && filteredApps.length > 0 ? (
              <StateMessage kind="error" message={error} />
            ) : null}
          </>
        }
        ListEmptyComponent={
          <StateMessage
            kind={isLoading ? 'loading' : error ? 'error' : 'empty'}
            message={
              isLoading
                ? t('common.loading')
                : error || t('adminList.noApplicationsForFilter')
            }
            actionLabel={error && !isLoading ? t('common.refresh') : undefined}
            onAction={() => dispatch(loadAdminApplications())}
          />
        }
      />
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: { gap: 4, paddingTop: 20 } as ViewStyle,
    h2: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    countText: { fontSize: 14, color: colors.textSecondary } as TextStyle,
    filterScroll: { marginHorizontal: -20, flexGrow: 0 } as ViewStyle,
    filterRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 20, gap: 8 } as ViewStyle,
    filterGap: { width: 1, backgroundColor: colors.borderLight, marginHorizontal: 4 } as ViewStyle,
    filterChip: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryText } as ViewStyle,
    filterText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' } as TextStyle,
    filterTextActive: { color: colors.primaryText } as TextStyle,
    listContainer: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: 20,
      gap: 10,
      paddingBottom: 20,
    } as ViewStyle,
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      gap: 14,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    } as ViewStyle,
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    avatarText: { fontSize: 16, fontWeight: '700', color: colors.primaryText } as TextStyle,
    rowContent: { flex: 1, gap: 4 } as ViewStyle,
    rowName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary } as TextStyle,
    rowSubtitle: { fontSize: 14, lineHeight: 19, color: colors.textSecondary } as TextStyle,
    searchWrap: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, paddingBottom: 4, gap: 10 } as ViewStyle,
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: colors.textPrimary } as TextStyle,
    refreshBtn: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerHigh,
    } as ViewStyle,
  });
