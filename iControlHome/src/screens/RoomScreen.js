import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function RoomScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Phòng</Text>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 22, height: 22 }}
          />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.body}>

        <RoomItem name="Phòng khách" />
        <RoomItem name="Phòng bếp" />
        <RoomItem name="Phòng ngủ" />
        <RoomItem name="Phòng tắm" />

        <Text style={styles.defaultText}>(Phòng mặc định)</Text>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionText}>Được chia sẻ</Text>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionText}>Chưa thuộc phòng</Text>
        </View>

      </ScrollView>

      

    </View>
  );
}

/* ROOM ITEM */
function RoomItem({ name }) {
  return (
    <View style={styles.roomItem}>
      <Text style={styles.roomName}>{name}</Text>

      <View style={styles.roomActions}>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/delete.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require('../../public/img/edit.png')}
            style={[styles.icon, { marginLeft: 12 }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* BOTTOM ITEM */
function BottomItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.bottomItem} onPress={onPress}>
      <Image
        source={icon}
        style={[
          styles.bottomIcon,
          active && { tintColor: '#000' },
        ]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.bottomText,
          active && styles.bottomActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e6e6',
  },

  header: {
    height: 70,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sortText: { color: '#fff', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  body: {
    padding: 16,
    paddingBottom: 90,
  },

  roomItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  roomName: { fontSize: 16, color: '#000' },

  roomActions: { flexDirection: 'row' },

  icon: { width: 20, height: 20 },

  defaultText: {
    textAlign: 'center',
    color: '#555',
    marginVertical: 12,
    fontSize: 13,
  },

  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  sectionText: { fontSize: 16, color: '#000' },

  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },

  bottomItem: { alignItems: 'center' },

  bottomIcon: {
    width: 22,
    height: 22,
    tintColor: '#666',
    marginBottom: 2,
  },

  bottomText: { fontSize: 12, color: '#666' },

  bottomActive: {
    color: '#000',
    fontWeight: '600',
  },
});
