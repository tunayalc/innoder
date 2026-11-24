import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useThemedStyles, type AppColors } from '../theme';

interface FieldProps {
  label: string;
  value: string;
  onPress?: () => void;
  isLink?: boolean;
}

export const Field: React.FC<FieldProps> = ({ label, value, onPress, isLink }) => {
  const styles = useThemedStyles(createStyles);
  const Wrapper = onPress ? Pressable : View;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Wrapper
        style={styles.inputFake}
        onPress={onPress}
        accessibilityRole={onPress ? (isLink ? 'link' : 'button') : undefined}
        accessibilityLabel={onPress ? `${label}: ${value}` : undefined}
      >
        <Text style={[styles.bodyText, isLink && styles.bodyTextLink]}>{value}</Text>
      </Wrapper>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  field: {
    gap: 6,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  } as TextStyle,
  inputFake: {
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerHigh,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyTextLink: {
    color: colors.primaryText,
    textDecorationLine: 'underline',
    fontWeight: '700',
  } as TextStyle,
});
