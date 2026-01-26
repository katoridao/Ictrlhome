import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function SettingScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cài đặt</Text>

        <View style={{ width: 22 }} />
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.body}>

        {/* USER INFO */}
        <View style={styles.userBox}>
          <Image
            source={require('../../public/img/avatar.png')}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>Phạm Hoàng Hưng</Text>
            <Text style={styles.userEmail}>hung@gmail.com</Text>
          </View>

          <Text style={styles.roleText}>Chủ nhà</Text>

          <Image
            source={require('../../public/img/arrow-right.png')}
            style={styles.arrow}
          />
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <View style={styles.sectionBox}>
          <SettingItem
            icon={require('../../public/img/user.png')}
            label="Chỉnh sửa thông tin"
          />
          <SettingItem
            icon={require('../../public/img/lock.png')}
            label="Đổi mật khẩu"
            noBorder
          />
        </View>

        {/* APP */}
        <Text style={styles.sectionTitle}>Ứng dụng</Text>
        <View style={styles.sectionBox}>
          <SettingItem
            icon={require('../../public/img/notification.png')}
            label="Thông báo"
          />
          <SettingItem
            icon={require('../../public/img/moon.png')}
            label="Giao diện"
            value="Tối/Sáng"
          />
          <SettingItem
            icon={require('../../public/img/language.png')}
            label="Ngôn ngữ"
            value="Vie/Eng"
            noBorder
          />
        </View>

        {/* OTHER */}
        <Text style={styles.sectionTitle}>Khác</Text>
        <View style={styles.sectionBox}>
          <SettingItem
            icon={require('../../public/img/help.png')}
            label="Trợ giúp"
          />
          <SettingItem
            icon={require('../../public/img/logout.png')}
            label="Đăng xuất"
            noBorder
          />
        </View>

      </ScrollView>

      

    </View>
  );
}

/* ================= COMPONENT ================= */

function SettingItem({ icon, label, value, noBorder }) {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        noBorder && { borderBottomWidth: 0 },
      ]}
    >
      <Image source={icon} style={styles.itemIcon} />

      <Text style={styles.itemText}>{label}</Text>

      {value && <Text style={styles.valueText}>{value}</Text>}

      <Image
        source={require('../../public/img/arrow-right.png')}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

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

/* ================= STYLE ================= */

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

  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  body: {
    padding: 16,
    paddingBottom: 90,
  },

  userBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },

  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  userEmail: {
    fontSize: 13,
    color: '#666',
  },

  roleText: {
    fontSize: 13,
    color: '#000',
    marginRight: 6,
  },

  sectionTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    marginLeft: 4,
  },

  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  itemIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },

  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  valueText: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },

  arrow: {
    width: 16,
    height: 16,
    tintColor: '#999',
  },

  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },

  bottomItem: {
    alignItems: 'center',
  },

  bottomIcon: {
    width: 22,
    height: 22,
    tintColor: '#666',
    marginBottom: 2,
  },

  bottomText: {
    fontSize: 12,
    color: '#666',
  },

  bottomActive: {
    color: '#000',
    fontWeight: '600',
  },
});
