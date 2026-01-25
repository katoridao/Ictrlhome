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
  Home: {
    normal: require('../../public/img/home.png'),
    active: require('../../public/img/homeclicked.png'),
  },
  Room: {
    normal: require('../../public/img/room.png'),
    active: require('../../public/img/roomclicked.png'),
  },
  Script: {
    normal: require('../../public/img/script.png'),
    active: require('../../public/img/scriptclicked.png'),
  },
  History: {
    normal: require('../../public/img/history.png'),
    active: require('../../public/img/historyclick.png'),
  },
  Setting: {
    normal: require('../../public/img/setting.png'),
    active: require('../../public/img/settingclicked.png'),
  },
};

export default function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Image
            source={
              focused ? icons[route.name].active : icons[route.name].normal
            }
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        ),
        tabBarActiveTintColor: '#000',
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
