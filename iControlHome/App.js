import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

// Import Theme Provider
import { ThemeProvider } from './src/context/ThemeContext';

// Import Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

import SelectHouseScreen from './src/screens/SelectHouseScreen';

import NotificationSettingScreen from './src/screens/NotificationSettingScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import MainTab from './src/navigation/MainTab';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />

          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />

          <Stack.Screen name="SelectHouse" component={SelectHouseScreen} />

          <Stack.Screen
            name="NotificationSetting"
            component={NotificationSettingScreen}
          />

          <Stack.Screen name="AppearanceScreen" component={AppearanceScreen} />

          <Stack.Screen name="Main" component={MainTab} />
        </Stack.Navigator>
      </NavigationContainer>

      <Toast />
    </ThemeProvider>
  );
}
