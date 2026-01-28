import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen'
import MainTab from './src/navigation/MainTab';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* Welcome / Splash */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen}/>
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTab} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
