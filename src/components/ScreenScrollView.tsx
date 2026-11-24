import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, useThemeColors } from '../theme';

// Stack screens: the navigator owns the top safe area. Tab screens draw their
// own header, so they pass safeTop; the floating tab bar owns the bottom inset.
export const ScreenScrollView: React.FC<ScrollViewProps & { safeTop?: boolean; inTabs?: boolean }> = ({
  children,
  contentContainerStyle,
  style,
  safeTop = false,
  inTabs = false,
  ...props
}) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const content = StyleSheet.flatten(contentContainerStyle);
  const bottomPadding = typeof content?.paddingBottom === 'number' ? content.paddingBottom : 32;
  const topPadding = typeof content?.paddingTop === 'number' ? content.paddingTop : layout.screenPadding;

  const scroll = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
        { paddingBottom: bottomPadding + (inTabs ? 0 : insets.bottom), paddingTop: topPadding },
      ]}
    >
      {children}
    </ScrollView>
  );
  // Keep scrolled content out from under the status bar on header-less screens.
  return safeTop ? (
    <View style={[styles.safeTop, { paddingTop: insets.top, backgroundColor: colors.background }]}>{scroll}</View>
  ) : (
    scroll
  );
};

const styles = StyleSheet.create({
  safeTop: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    gap: 16,
  },
});
