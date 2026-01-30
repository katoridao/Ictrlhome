import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  StatusBar,
} from 'react-native';

export default function NotificationSettingScreen({ navigation }) {
  const [notify, setNotify] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View
      style={[
        styles.container,
        darkMode && { backgroundColor: '#121212' },
      ]}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? '#121212' : '#3b9cff'}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          darkMode && { backgroundColor: '#1f1f1f' },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={[styles.backIcon, darkMode && { tintColor: '#fff' }]}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            darkMode && { color: '#fff' },
          ]}
        >
          Thông báo
        </Text>

        <View style={{ width: 22 }} />
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <View
          style={[
            styles.settingItem,
            darkMode && styles.darkItem,
          ]}
        >
          <Text
            style={[
              styles.label,
              darkMode && { color: '#fff' },
            ]}
          >
            {/* shadhjah */}
            Bật thông báo
          </Text>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ true: '#3b9cff' }}
          />
        </View>

        <View
          style={[
            styles.settingItem,
            darkMode && styles.darkItem,
          ]}
        >
          <Text
            style={[
              styles.label,
              darkMode && { color: '#fff' },
            ]}
          >
            Chế độ tối
          </Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: '#3b9cff' }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },

  header: {
    height: 80,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  body: {
    padding: 16,
  },

  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },

  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  darkItem: {
    backgroundColor: '#1f1f1f',
  },
});
