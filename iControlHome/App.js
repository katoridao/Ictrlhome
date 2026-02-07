import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

// Import Theme Provider
import { ThemeProvider } from './src/context/ThemeContext';

// Import Screens - Authentication & Onboarding
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Import Screens - Device Management
import AddDeviceModal from './src/screens/AddDeviceModal'; 
import DeviceControlScreen from './src/screens/DeviceControlScreen'; 
import UnassignedDevicesScreen from './src/screens/UnassignedDevicesScreen'; // Màn hình Kho thiết bị

// Import Screens - Room Management
import RoomDetailScreen from './src/screens/RoomDetailScreen'; // Màn hình Chi tiết phòng

// Import Screens - Settings & Profile
import SelectHouseScreen from './src/screens/SelectHouseScreen';
import NotificationSettingScreen from './src/screens/NotificationSettingScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import Navigation - Tab
import MainTab from './src/navigation/MainTab';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ headerShown: false }} 
          initialRouteName="Welcome"
        >
          {/* Luồng khởi đầu */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

          {/* Luồng Chính (Tabs: Home, Room, Script, History, Setting) */}
          <Stack.Screen name="Main" component={MainTab} />

          {/* Quản lý thiết bị */}
          <Stack.Screen name="AddDevice" component={AddDeviceModal} />
          <Stack.Screen name="EditDevice" component={AddDeviceModal} />
          <Stack.Screen 
            name="DeviceControl" 
            component={DeviceControlScreen} 
            options={{ headerShown: true, title: 'Điều khiển thiết bị' }} 
          />
          <Stack.Screen 
            name="UnassignedDevices" 
            component={UnassignedDevicesScreen} 
            options={{ 
              headerShown: true, 
              title: 'Kho thiết bị',
              headerStyle: { backgroundColor: '#2196F3' },
              headerTintColor: '#fff' 
            }} 
          />

          {/* Quản lý phòng */}
          <Stack.Screen 
            name="RoomDetail" 
            component={RoomDetailScreen} 
            options={{ 
              headerShown: true, 
              title: 'Chi tiết phòng',
              headerStyle: { backgroundColor: '#2196F3' },
              headerTintColor: '#fff'
            }} 
          />

          {/* Cài đặt & Cá nhân hóa */}
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="SelectHouse" component={SelectHouseScreen} />
          <Stack.Screen
            name="NotificationSetting"
            component={NotificationSettingScreen}
          />
          <Stack.Screen name="AppearanceScreen" component={AppearanceScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>

      {/* Toast để hiển thị thông báo nhanh (Thành công/Lỗi) */}
      <Toast />
    </ThemeProvider>
  );
}