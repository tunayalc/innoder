import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { RootNavigator } from './src/navigation';
import { store, persistor } from './src/store';
import { useAppTheme, useThemedStyles, type AppColors } from './src/theme';

const AppContent: React.FC = () => {
  const { colors, isDarkMode } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const navigationTheme = useMemo(
    () => ({
      ...NavigationDefaultTheme,
      dark: isDarkMode,
      colors: {
        ...NavigationDefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.textPrimary,
        border: colors.borderLight,
        notification: colors.primary,
      },
    }),
    [colors, isDarkMode],
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.container}>
          <View style={styles.orbA} />
          <View style={styles.orbB} />
          <RootNavigator />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    orbA: {
      position: 'absolute',
      top: -140,
      right: -140,
      width: 300,
      height: 300,
      borderRadius: 999,
      backgroundColor: colors.orbOrange,
    },
    orbB: {
      position: 'absolute',
      bottom: -160,
      left: -120,
      width: 320,
      height: 320,
      borderRadius: 999,
      backgroundColor: colors.tealMuted,
    },
  });

export default App;
