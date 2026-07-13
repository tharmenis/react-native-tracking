import 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/navigation/AppNavigator';
import { RootStackParamList } from './src/app/navigation/types';
import { PushNotificationsProvider } from './src/shared/notifications/PushNotificationsProvider';
import { colors } from './src/shared/theme/theme';

const rootStyle = { flex: 1 } as const;

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.gray50,
    card: colors.white,
    primary: colors.blue600,
    text: colors.gray900,
    border: colors.gray200,
    notification: colors.alert,
  },
};

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [navigationReady, setNavigationReady] = useState(false);
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <PushNotificationsProvider navigationReady={navigationReady} navigationRef={navigationRef}>
          <NavigationContainer onReady={() => setNavigationReady(true)} ref={navigationRef} theme={navigationTheme}>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </PushNotificationsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}