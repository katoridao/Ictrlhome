import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../database/api';

const ChangePasswordScreen = ({ navigation, route }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = route.params?.phone;

  const handleChangePassword = async () => {
    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOld || !cleanNew || !cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập đầy đủ các trường'
      });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Xác nhận mật khẩu mới không khớp'
      });
      return;
    }

    if (cleanNew.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/change-password', {
        phone,
        oldPassword: cleanOld,
        newPassword: cleanNew
      });

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: response.data.message || 'Đổi mật khẩu thành công'
      });
      
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data?.message || "Không thể đổi mật khẩu";
      Toast.show({
        type: 'error',
        text1: 'Thất bại',
        text2: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Thiết lập mật khẩu mới</Text>

      <TextInput 
        placeholder="Mật khẩu hiện tại" 
        secureTextEntry 
        style={styles.input} 
        onChangeText={setOldPassword}
        placeholderTextColor="#999"
        autoCapitalize="none"
      />
      
      <TextInput 
        placeholder="Mật khẩu mới" 
        secureTextEntry 
        style={styles.input} 
        onChangeText={setNewPassword}
        placeholderTextColor="#999"
        autoCapitalize="none"
      />

      <TextInput 
        placeholder="Xác nhận mật khẩu mới" 
        secureTextEntry 
        style={styles.input} 
        onChangeText={setConfirmPassword}
        placeholderTextColor="#999"
        autoCapitalize="none"
      />

      <TouchableOpacity 
        style={[styles.button, loading && { backgroundColor: '#A5CFFF' }]} 
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>CẬP NHẬT</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    color: '#000',
  },
  button: {
    backgroundColor: '#3b9cff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  }
});

export default ChangePasswordScreen;