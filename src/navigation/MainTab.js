import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import RoomScreen from '../screens/RoomScreen';
import ScriptScreen from '../screens/ScriptScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingScreen from '../screens/SettingScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Home: require('../../public/img/home.png'),
  Room: require('../../public/img/room.png'),
  Script: require('../../public/img/script.png'),
  History: require('../../public/img/history.png'),
  Setting: require('../../public/img/setting.png'),
};

export default function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Image
            source={icons[route.name]}
            style={{
              width: 24,
              height: 24,
              tintColor: focused ? '#FF5A5F' : '#999',
            }}
            resizeMode="contain"
          />
        ),
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 6,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Room" component={RoomScreen} />
      <Tab.Screen name="Script" component={ScriptScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Setting" component={SettingScreen} />
    </Tab.Navigator>
  );
}
