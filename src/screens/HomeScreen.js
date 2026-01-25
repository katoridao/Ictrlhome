import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

/* MAP ICON */
const icons = {
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
  history: {
    normal: require('../../public/img/history.png'),
    active: require('../../public/img/historyclick.png'),
  },
  setting: {
    normal: require('../../public/img/setting.png'),
    active: require('../../public/img/settingclicked.png'),
  },
};

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>Nhà riêng</Text>
          <Image
            source={require('../../public/img/down.png')}
            style={{ width: 16, height: 16 }}
          />
        </View>

        <View style={styles.headerIcons}>
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 24, height: 24 }}
          />
          <Image
            source={require('../../public/img/setting.png')}
            style={{ width: 24, height: 24, marginLeft: 12 }}
          />
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.emptyText}>Không có thiết bị nào!</Text>

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Thêm thiết bị</Text>
        </TouchableOpacity>
      </View>

      

    </View>
  );
}

/* TAB ITEM */
function TabItem({ iconKey, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Image
        source={active ? icons[iconKey].active : icons[iconKey].normal}
        style={{ width: 22, height: 22 }}
        resizeMode="contain"
      />
      <Text style={[styles.tabText, active && styles.tabActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#e6e6e6', }, /* HEADER */ header: { backgroundColor: '#3b9cff', height: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, }, dropdown: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', }, dropdownText: { marginRight: 6, color: '#000', }, headerIcons: { flexDirection: 'row', alignItems: 'center', }, /* BODY */ body: { flex: 1, justifyContent: 'center', alignItems: 'center', }, emptyText: { color: '#000', marginBottom: 12, }, addButton: { backgroundColor: '#0a84ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, }, addButtonText: { color: '#fff', fontWeight: '600', }, /* BOTTOM TAB */ bottomTab: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', }, tabItem: { alignItems: 'center', }, tabText: { fontSize: 12, color: '#666', }, tabActive: { color: '#000', fontWeight: '600', }, });