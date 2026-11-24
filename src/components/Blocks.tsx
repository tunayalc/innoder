import React, { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

// Section title with an optional trailing red link ("Tümünü gör").
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, subtitle, actionLabel, onAction }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flexText}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="link" hitSlop={10} onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

// Outlined context chip with a leading icon, e.g. program · stage.
export const InfoChip: React.FC<{ icon: string; label: string; onPress?: () => void }> = ({
  icon,
  label,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      <Icon name={icon} size={16} color={colors.textPrimary} />
      <Text numberOfLines={1} style={styles.chipText}>{label}</Text>
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    <View accessible style={styles.chip}>{content}</View>
  );
};

export const ChipRow: React.FC<{ children: ReactNode }> = ({ children }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.bleed}
    >
      {children}
    </ScrollView>
  );
};

// Horizontal carousel that bleeds to the screen edges.
export const Carousel: React.FC<{ children: ReactNode }> = ({ children }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carousel}
      style={styles.bleed}
    >
      {children}
    </ScrollView>
  );
};

// Underlined tabs with a red indicator.
export const SegmentedTabs = <T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ key: T; label: string; count?: number }>;
  value: T;
  onChange: (key: T) => void;
}) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {tabs.map(tab => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.tab, selected && styles.tabSelected]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  total: number;
  label: string;
  onHero?: boolean;
}> = ({ value, total, label, onHero }) => {
  const styles = useThemedStyles(createStyles);
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total || 1, now: value }}
      style={[styles.track, onHero && styles.trackHero]}
    >
      <View style={[styles.fill, onHero && styles.fillHero, { width: `${ratio * 100}%` }]} />
    </View>
  );
};

// Dark navy hero card: title, progress and actions.
export const HeroCard: React.FC<{
  eyebrow?: string;
  title: string;
  progress?: { value: number; total: number; caption: string };
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ eyebrow, title, progress, children, style }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.hero, style]}>
      {eyebrow ? <Text style={styles.heroEyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text>
      {progress ? (
        <View style={styles.heroProgress}>
          <ProgressBar value={progress.value} total={progress.total} label={progress.caption} onHero />
          <Text style={styles.heroCaption}>{progress.caption}</Text>
        </View>
      ) : null}
      {children ? <View style={styles.heroActions}>{children}</View> : null}
    </View>
  );
};

// Icon + title + description row, like a benefits list.
export const FeatureRow: React.FC<{
  icon: string;
  title: string;
  description?: string;
  badge?: string;
  tone?: 'brand' | 'ok' | 'warn' | 'err' | 'info';
  onPress?: () => void;
  children?: ReactNode;
}> = ({ icon, title, description, badge, tone = 'brand', onPress, children }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const palette = {
    brand: [colors.primarySoft, colors.primaryText],
    ok: [colors.success, colors.onSuccess],
    warn: [colors.warning, colors.onWarning],
    err: [colors.error, colors.onError],
    info: [colors.info, colors.onInfo],
  }[tone];
  const body = (
    <>
      <View style={[styles.featureIcon, { backgroundColor: palette[0] }]}>
        <Icon name={icon} size={22} color={palette[1]} />
      </View>
      <View style={styles.flexText}>
        <View style={styles.featureTitleRow}>
          <Text style={styles.featureTitle}>{title}</Text>
          {badge ? <Text style={styles.featureBadge}>{badge}</Text> : null}
        </View>
        {description ? <Text style={styles.featureDescription}>{description}</Text> : null}
        {children}
      </View>
      {onPress ? <Icon name="chevron-right" size={22} color={colors.textMuted} /> : null}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, badge, description].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.feature, pressed && styles.pressed]}
      onPress={onPress}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.feature}>{body}</View>
  );
};

// Carousel card: tinted visual header, title, meta and quick actions.
export const TaskCard: React.FC<{
  icon: string;
  title: string;
  meta?: string;
  statusLabel?: string;
  tone?: 'brand' | 'ok' | 'warn' | 'err' | 'info';
  onPress?: () => void;
  children?: ReactNode;
}> = ({ icon, title, meta, statusLabel, tone = 'brand', onPress, children }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const palette = {
    brand: [colors.primarySoft, colors.primaryText],
    ok: [colors.success, colors.onSuccess],
    warn: [colors.warning, colors.onWarning],
    err: [colors.error, colors.onError],
    info: [colors.info, colors.onInfo],
  }[tone];
  return (
    <View style={styles.taskCard}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={[title, statusLabel, meta].filter(Boolean).join('. ')}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.taskVisual, { backgroundColor: palette[0] }, pressed && styles.pressed]}
      >
        <Icon name={icon} size={40} color={palette[1]} />
        {statusLabel ? (
          <View style={styles.taskStatus}>
            <Text style={[styles.taskStatusText, { color: palette[1] }]}>{statusLabel}</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={styles.taskBody}>
        <Text numberOfLines={2} style={styles.taskTitle}>{title}</Text>
        {meta ? <Text numberOfLines={2} style={styles.taskMeta}>{meta}</Text> : null}
        {children ? <View style={styles.taskActions}>{children}</View> : null}
      </View>
    </View>
  );
};

// Round icon button, used on hero images and headers.
export const IconCircleButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}> = ({ icon, label, onPress, badge }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      hitSlop={6}
      style={({ pressed }) => [styles.iconCircle, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Icon name={icon} size={22} color={colors.textPrimary} />
      {badge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    pressed: { opacity: 0.82 } as ViewStyle,
    flexText: { flex: 1, minWidth: 0, gap: 2 } as ViewStyle,
    bleed: { marginHorizontal: -20, flexGrow: 0 } as ViewStyle,
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 8,
    } as ViewStyle,
    sectionTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    sectionSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    sectionAction: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
      paddingVertical: 2,
    } as TextStyle,
    chipRow: { paddingHorizontal: 20, gap: 8 } as ViewStyle,
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
      maxWidth: 280,
    } as ViewStyle,
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      flexShrink: 1,
    } as TextStyle,
    carousel: { paddingHorizontal: 20, gap: 14, paddingBottom: 8, paddingTop: 2 } as ViewStyle,
    tabs: {
      flexDirection: 'row',
      gap: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    } as ViewStyle,
    tab: {
      minHeight: 44,
      justifyContent: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
      marginBottom: -1,
    } as ViewStyle,
    tabSelected: { borderBottomColor: colors.primary } as ViewStyle,
    tabText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary } as TextStyle,
    tabTextSelected: { color: colors.primaryText, fontWeight: '600' } as TextStyle,
    track: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHighest,
      overflow: 'hidden',
    } as ViewStyle,
    trackHero: { backgroundColor: colors.heroTrack } as ViewStyle,
    fill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary } as ViewStyle,
    fillHero: { backgroundColor: colors.heroText } as ViewStyle,
    hero: {
      backgroundColor: colors.heroBg,
      borderRadius: 18,
      padding: 20,
      gap: 14,
    } as ViewStyle,
    heroEyebrow: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.heroMuted,
      textTransform: 'uppercase',
    } as TextStyle,
    heroTitle: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      color: colors.heroText,
    } as TextStyle,
    heroProgress: { gap: 8 } as ViewStyle,
    heroCaption: { fontSize: 14, color: colors.heroMuted } as TextStyle,
    heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 } as ViewStyle,
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
    } as ViewStyle,
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    featureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as ViewStyle,
    featureTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.textPrimary } as TextStyle,
    featureBadge: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      backgroundColor: colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    } as TextStyle,
    featureDescription: { fontSize: 14, lineHeight: 20, color: colors.textSecondary } as TextStyle,
    taskCard: {
      width: 260,
      borderRadius: 16,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    } as ViewStyle,
    taskVisual: {
      height: 108,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    taskStatus: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: colors.cardBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    } as ViewStyle,
    taskStatusText: { fontSize: 12, fontWeight: '700' } as TextStyle,
    taskBody: { padding: 14, gap: 6 } as ViewStyle,
    taskTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    taskMeta: { fontSize: 14, lineHeight: 19, color: colors.textSecondary } as TextStyle,
    taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 } as ViewStyle,
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    } as ViewStyle,
    iconBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    iconBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white } as TextStyle,
  });
