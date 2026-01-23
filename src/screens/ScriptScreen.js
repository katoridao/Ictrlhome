import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function ScriptScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Kịch bản</Text>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 22, height: 22 }}
          />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.body}>
        <ScriptItem
          icon={require('../../public/img/tv.png')}
          title="Kịch bản 1"
        />

        <ScriptItem
          icon={require('../../public/img/fan.png')}
          title="Kịch bản mới"
        />
      </ScrollView>

      {/* BOTTOM MENU */}
      <View style={styles.bottomTab}>
        <BottomItem
          icon={require('../../public/img/home.png')}
          label="Nhà"
          onPress={() => navigation.replace('Home')}
        />

        <BottomItem
          icon={require('../../public/img/room.png')}
          label="Phòng"
          onPress={() => navigation.replace('Room')}
        />

        <BottomItem
          icon={require('../../public/img/scriptclicked.png')}
          label="Kịch bản"
          active
          onPress={() => navigation.replace('Script')}
        />

        <BottomItem
          icon={require('../../public/img/history.png')}
          label="Lịch sử"
          onPress={() => navigation.replace('History')}
        />

        <BottomItem
          icon={require('../../public/img/setting.png')}
          label="Cài đặt"
          onPress={() => navigation.replace('Setting')}
        />
      </View>
    </View>
  );
}

/* SCRIPT ITEM */
function ScriptItem({ icon, title }) {
  return (
    <View style={styles.card}>
      <Image source={icon} style={styles.scriptIcon} />

      <Text style={styles.cardText}>{title}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/clip.png')}
            style={styles.actionIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require('../../public/img/menu-dots.png')}
            style={[styles.actionIcon, { marginLeft: 12 }]}
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

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scriptIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },

  cardText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  cardActions: {
    flexDirection: 'row',
  },

  actionIcon: {
    width: 20,
    height: 20,
  },

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
