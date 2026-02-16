import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';
import { useAuthStore } from './src/store/authStore';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background.dark}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor={COLORS.background.dark}
              translucent
            />
            <AppNavigator />
          </NavigationContainer>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
});

export default App;


// npm start
// # OR
// npx react-native start

// npm run android
// # OR
// npx react-native run-android --no-packager
