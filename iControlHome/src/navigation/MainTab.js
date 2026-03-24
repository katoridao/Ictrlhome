import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';

import HomeScreen from '../screens/HomeScreen';
import RoomScreen from '../screens/RoomScreen';
import ScriptScreen from '../screens/ScriptScreen';
import Device_logScreen from '../screens/Device_logScreen';
import SettingScreen from '../screens/SettingScreen';

const Tab = createBottomTabNavigator();

const tabIcons = {
  home: {
    normal: require('../../public/img/home.png'),
    active: require('../../public/img/homeclicked.png'),
  },
  room: {
    normal: require('../../public/img/room.png'),
    active: require('../../public/img/roomclicked.png'),
  },
  script: {
    normal: require('../../public/img/script.png'),
    active: require('../../public/img/scriptclicked.png'),
  },
  log: {
    normal: require('../../public/img/history.png'),
    active: require('../../public/img/historyclick.png'),
  },
  setting: {
    normal: require('../../public/img/setting.png'),
    active: require('../../public/img/settingclicked.png'),
  },
};

export default function MainTab() {
  const { t } = useContext(LanguageContext);

  const tabs = [
    { key: 'home', name: t.tab_home, component: HomeScreen, icon: 'home' },
    { key: 'room', name: t.tab_room, component: RoomScreen, icon: 'room' },
    {
      key: 'script',
      name: t.tab_script,
      component: ScriptScreen,
      icon: 'script',
    },
    { key: 'log', name: t.tab_log, component: Device_logScreen, icon: 'log' },
    {
      key: 'setting',
      name: t.tab_setting,
      component: SettingScreen,
      icon: 'setting',
    },
  ];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find(t => t.name === route.name);
        const iconKey = tab?.icon;

        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused ? tabIcons[iconKey].active : tabIcons[iconKey].normal
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
        };
      }}
    >
      {tabs.map(tab => (
        <Tab.Screen key={tab.key} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}
