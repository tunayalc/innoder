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
      <Wrapper style={styles.inputFake} onPress={onPress}>
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
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  inputFake: {
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerHigh,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  bodyTextLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '700',
  } as TextStyle,
});
