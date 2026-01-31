import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar 
                barStyle="dark-content" 
                backgroundColor={colors.background} 
              />
              <View style={styles.container}>
                <View style={styles.orbA} />
                <View style={styles.orbB} />
                <RootNavigator />
              </View>
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
