import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const ChangePasswordScreen = ({ navigation, route }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const phone = route.params?.phone;

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Xác nhận mật khẩu mới không khớp");
      return;
    }

    try {
      const response = await axios.post('http://192.168.56.2:3000/api/change-password', {
        phone,
        oldPassword,
        newPassword
      });
      Alert.alert("Thành công", response.data.message);
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data?.message || "Không thể đổi mật khẩu";
      Alert.alert("Lỗi", msg);
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
      />
      
      <TextInput 
        placeholder="Mật khẩu mới" 
        secureTextEntry 
        style={styles.input} 
        onChangeText={setNewPassword}
        placeholderTextColor="#999"
      />

      <TextInput 
        placeholder="Xác nhận mật khẩu mới" 
        secureTextEntry 
        style={styles.input} 
        onChangeText={setConfirmPassword}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>CẬP NHẬT</Text>
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