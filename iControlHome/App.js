import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/context/ThemeContext';
import {
  LanguageProvider,
  LanguageContext,
} from './src/context/LanguageContext';
import LanguageSettingScreen from './src/screens/Setting/LanguageSettingScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import AddDeviceModal from './src/screens/AddDeviceModal';
import DeviceControlScreen from './src/screens/DeviceControlScreen';
import RoomDetailScreen from './src/screens/RoomDetailScreen';
import NotificationSettingScreen from './src/screens/NotificationSettingScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import JoinHouseScreen from './src/screens/JoinHouseScreen';
import {
  ManageMembersScreen,
  MemberPermissionScreen,
} from './src/screens/MemberManagement';
import PeopleScreen from './src/screens/PeopleScreen';
import EntryExitScreen from './src/screens/EntryExitScreen';
import MainTab from './src/navigation/MainTab';
import MainAutomationScreen from './src/screens/MainAutomationScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { t } = useContext(LanguageContext);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Welcome"
      >
        {/* Auth */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Main Tab */}
        <Stack.Screen name="Main" component={MainTab} />

        {/* Device */}
        <Stack.Screen name="AddDevice" component={AddDeviceModal} />
        <Stack.Screen name="EditDevice" component={AddDeviceModal} />
        <Stack.Screen
          name="DeviceControl"
          component={DeviceControlScreen}
          options={{
            headerShown: true,
            title: t.device_control,
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
          }}
        />

        {/* Room */}
        <Stack.Screen
          name="RoomDetail"
          component={RoomDetailScreen}
          options={{
            headerShown: true,
            title: 'Chi tiết phòng',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
          }}
        />

        {/* Settings */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen
          name="NotificationSetting"
          component={NotificationSettingScreen}
        />
        <Stack.Screen name="AppearanceScreen" component={AppearanceScreen} />
        <Stack.Screen name="StatisticsScreen" component={StatisticsScreen} />
        <Stack.Screen name="JoinHouse" component={JoinHouseScreen} />

        {/* Automation */}
        <Stack.Screen
          name="Automation"
          component={MainAutomationScreen}
          options={{
            headerShown: true,
            title: t.automation_setup,
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          }}
        />

        {/* Member Management */}
        <Stack.Screen
          name="ManageMembers"
          component={ManageMembersScreen}
          options={{
            headerShown: true,
            title: t.manage_members_title,
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          }}
        />

        <Stack.Screen
          name="MemberPermission"
          component={MemberPermissionScreen}
          options={{
            headerShown: true,
            title: 'Phân quyền thiết bị',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          }}
        />

        {/* People & Entry/Exit */}
        <Stack.Screen
          name="PeopleScreen"
          component={PeopleScreen}
          options={{
            headerShown: true,
            title: 'Danh sách khuôn mặt',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="EntryExitScreen"
          component={EntryExitScreen}
          options={{
            headerShown: true,
            title: 'Lịch sử ra/vào',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          }}
        />

        <Stack.Screen
          name="LanguageSetting"
          component={LanguageSettingScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppNavigator />
        <Toast />
      </LanguageProvider>
    </ThemeProvider>
  );
}
