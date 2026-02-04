import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => navigation.navigate('SelectHouse')}
        >
          <Text style={styles.dropdownText}>Nhà riêng</Text>
          <Image
            source={require('../../public/img/down.png')}
            style={{ width: 16, height: 16 }}
          />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 24, height: 24, tintColor: '#fff' }}
          />
          <Image
            source={require('../../public/img/setting.png')}
            style={{ width: 24, height: 24, marginLeft: 12, tintColor: '#fff' }}
          />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.emptyText, { color: themeStyles.text }]}>
          Không có thiết bị nào!
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeStyles.primary }]}
        >
          <Text style={styles.addButtonText}>Thêm thiết bị</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: { marginRight: 6, color: '#000' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginBottom: 12 },
  addButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
