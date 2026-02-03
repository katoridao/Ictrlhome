import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../database/api'; 

const ProfileScreen = ({ navigation, route }) => {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(route.params?.name || 'VU');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (route.params?.phone) {
          setPhone(route.params.phone);
        } else {
          const savedPhone = await AsyncStorage.getItem('phone'); 
          if (savedPhone) setPhone(savedPhone);
        }
      } catch (error) {
        console.log(error);
      }
    };
    loadUserData();
  }, [route.params?.phone]);

  const handleUpdateAll = async () => {
    const cleanName = fullName.trim();
    if (!cleanName) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Họ tên không được để trống' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/update-profile', { phone, fullName: cleanName });

      if (response.status === 200) {
        const updatedUser = response.data.user;
        await AsyncStorage.setItem('user_info', JSON.stringify(updatedUser));
      }

      if (oldPassword && newPassword) {
        if (newPassword !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");
        await api.post('/change-password', { phone, oldPassword, newPassword });
      }

      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Thông tin đã được đồng bộ!' });
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Lỗi cập nhật";
      Toast.show({ type: 'error', text1: 'Thất bại', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image source={require('../../public/img/avatar.png')} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn}>
            <Text style={styles.cameraText}>SỬA</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerName}>{fullName}</Text>
        <Text style={styles.headerPhone}>{phone}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionLabel}>THÔNG TIN TÀI KHOẢN</Text>
        <Text style={styles.fieldLabel}>Số điện thoại (ID đăng nhập)</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={phone} editable={false} />

        <Text style={styles.fieldLabel}>Họ và tên</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nhập họ tên" />

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>ĐỔI MẬT KHẨU</Text>
        <TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} placeholder="Mật khẩu cũ" secureTextEntry />
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="Mật khẩu mới" secureTextEntry />
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Xác nhận mật khẩu" secureTextEntry />

        <TouchableOpacity style={[styles.btnSave, loading && { backgroundColor: '#ccc' }]} onPress={handleUpdateAll} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LƯU TẤT CẢ</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnCancel}>
          <Text style={styles.cancelText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#3b9cff', paddingVertical: 35, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 2, borderColor: '#fff' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cameraText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  headerPhone: { color: '#e0f0ff', fontSize: 14 },
  form: { padding: 20 },
  sectionLabel: { fontSize: 13, color: '#3b9cff', fontWeight: 'bold', marginBottom: 15 },
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, height: 48, color: '#333', borderWidth: 1, borderColor: '#eee' },
  disabledInput: { backgroundColor: '#ececec', color: '#888' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  btnSave: { backgroundColor: '#3b9cff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#999', fontSize: 14 }
});

export default ProfileScreen;