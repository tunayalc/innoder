import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles, useThemeColors, type AppColors } from '../theme';
import { Button } from './Button';

interface StateMessageProps {
  message: string;
  kind?: 'empty' | 'error' | 'loading';
  actionLabel?: string;
  onAction?: () => void;
}

export const StateMessage: React.FC<StateMessageProps> = ({ message, kind = 'empty', actionLabel, onAction }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      {kind === 'loading' ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Icon accessible={false} name={kind === 'error' ? 'alert-circle-outline' : 'inbox-outline'} size={28} color={kind === 'error' ? colors.danger : colors.textMuted} />
      )}
      <Text
        accessibilityRole={kind === 'error' ? 'alert' : 'text'}
        accessibilityLiveRegion="polite"
        style={[styles.message, kind === 'error' && styles.error]}
      >
        {message}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} variant="ghost" onPress={onAction} /> : null}
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, gap: 12 },
  message: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  error: { color: colors.danger },
});
