import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingScreen({ navigation }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user_info');
        if (jsonValue !== null) {
          setUserData(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Lỗi lấy dữ liệu:", e);
      }
    };
    loadUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn thoát khỏi ứng dụng?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đồng ý", 
          onPress: async () => {
            await AsyncStorage.removeItem('user_info');
            navigation.replace('Login');
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b9cff" />

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

      <ScrollView contentContainerStyle={styles.body}>
        {/* USER INFO */}
        <TouchableOpacity 
          style={styles.userBox}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image
            source={require('../../public/img/avatar.png')}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{userData?.name || "Đang tải..."}</Text>
            <Text style={styles.userEmail}>{userData?.email || "Chưa cập nhật"}</Text>
          </View>
          <Text style={styles.roleText}>Chủ nhà</Text>
          <Image
            source={require('../../public/img/arrow-right.png')}
            style={styles.arrow}
          />
        </TouchableOpacity>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <View style={styles.sectionBox}>
          <SettingItem
            icon={require('../../public/img/user.png')}
            label="Chỉnh sửa thông tin"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            icon={require('../../public/img/lock.png')}
            label="Đổi mật khẩu"
            noBorder
            onPress={() => navigation.navigate('ChangePassword', { phone: userData?.phone })}
          />
        </View>

        {/* APP */}
        <Text style={styles.sectionTitle}>Ứng dụng</Text>
        <View style={styles.sectionBox}>
          <SettingItem
            icon={require('../../public/img/notification.png')}
            label="Thông báo"
            onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")}
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
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ icon, label, value, noBorder, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.item, noBorder && { borderBottomWidth: 0 }]}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    height: 80,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  backIcon: { width: 22, height: 22, tintColor: '#fff' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  userBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  userName: { fontSize: 18, fontWeight: '700', color: '#333' },
  userEmail: { fontSize: 14, color: '#777' },
  roleText: { fontSize: 13, color: '#3b9cff', fontWeight: '600', marginRight: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#888', marginBottom: 8, marginLeft: 4 },
  sectionBox: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 1 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemIcon: { width: 22, height: 22, marginRight: 14 },
  itemText: { flex: 1, fontSize: 16, color: '#333' },
  valueText: { fontSize: 14, color: '#999', marginRight: 6 },
  arrow: { width: 14, height: 14, tintColor: '#ccc' },
});