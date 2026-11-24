import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, useThemeColors } from '../theme';

// For stack screens: the navigator already owns the top safe area.
export const ScreenScrollView: React.FC<ScrollViewProps> = ({
  children,
  contentContainerStyle,
  style,
  ...props
}) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const content = StyleSheet.flatten(contentContainerStyle);
  const bottomPadding = typeof content?.paddingBottom === 'number' ? content.paddingBottom : 32;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
        { paddingBottom: bottomPadding + insets.bottom },
      ]}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    gap: 16,
  },
});
