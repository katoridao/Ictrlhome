import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

import SelectHouseScreen from './src/screens/SelectHouseScreen';
import NotificationSettingScreen from './src/screens/NotificationSettingScreen';

import MainTab from './src/navigation/MainTab';
import ProfileSceen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Welcome / Splash */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />

          {/* Auth */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          <Stack.Screen name="SelectHouse" component={SelectHouseScreen} />
          <Stack.Screen
            name="NotificationSetting"
            component={NotificationSettingScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="Profile" component={ProfileSceen} />

          {/* Main App */}
          <Stack.Screen name="Main" component={MainTab} />
        </Stack.Navigator>
      </NavigationContainer>

      <Toast />
    </>
  );
}
