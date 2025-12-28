import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

// Only import gesture handler on native platforms
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Hide navigation bar and enable immersive mode
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProvider>
          <NavigationContainer>
            <StatusBar hidden />
            <RootNavigator />
          </NavigationContainer>
        </WebSocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
