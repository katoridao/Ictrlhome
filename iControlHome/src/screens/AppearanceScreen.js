import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AppearanceScreen({ navigation }) {
  const { theme, changeTheme, styles } = useTheme();
  const [darkMode, setDarkMode] = useState(false);

  const options = [
    { label: 'Sáng (Light Mode)', value: 'LIGHT' },
    { label: 'Tối (Dark Mode)', value: 'DARK' },
  ];

  return (
    <View
      style={[localStyles.container, { backgroundColor: styles.background }]}
    >
      <StatusBar barStyle="light-content" backgroundColor={styles.primary} />

      <View style={[localStyles.header, { backgroundColor: styles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={[styles.backIcon, darkMode && { tintColor: '#fff' }]}
          />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Giao diện</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ marginTop: 20 }}>
        {options.map(item => (
          <TouchableOpacity
            key={item.value}
            style={[
              localStyles.item,
              {
                backgroundColor: styles.card,
                borderBottomColor: styles.border,
              },
            ]}
            onPress={() => changeTheme(item.value)}
          >
            <Text style={[localStyles.itemText, { color: styles.text }]}>
              {item.label}
            </Text>
            {theme === item.value && <View style={localStyles.radioActive} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  itemText: { flex: 1, fontSize: 16 },
  radioActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b9cff',
  },
});
