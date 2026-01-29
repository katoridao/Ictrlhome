import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../database/api';

export default function RegisterScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập đầy đủ thông tin'
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    try {
      const response = await api.post('/register', {
        name: name.trim(),
        phone: phone.trim(),
        password,
      });

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đăng ký tài khoản thành công!'
        });
        navigation.navigate('Login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi kết nối server';
      Toast.show({
        type: 'error',
        text1: 'Thất bại',
        text2: errorMessage
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.appName}>iCtrlHome</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Nhập họ tên"
          placeholderTextColor="#888"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />
        <TextInput
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#888"
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirm}
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.showText}>{showConfirm ? 'Ẩn' : 'Hiện'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Quên mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', backgroundColor: '#A8C0FF' },
  logoContainer: { alignItems: 'center', marginTop: 80 },
  logo: { width: 70, height: 70, resizeMode: 'contain' },
  appName: { marginTop: 8, fontSize: 22, fontWeight: '600', color: '#333' },
  form: { paddingHorizontal: 24 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, height: 48, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  passwordBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, height: 48, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  passwordInput: { flex: 1 },
  showText: { color: '#3B82F6', fontWeight: '500' },
  button: { backgroundColor: '#6C7CFF', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  footer: { alignItems: 'center', marginBottom: 40 },
  loginText: { color: '#3B82F6', fontWeight: '600', marginBottom: 8 },
  forgotText: { color: '#555', fontSize: 13 },
});