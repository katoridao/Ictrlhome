import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../database/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const cleanPhone = phone.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPhone || !cleanNew || !cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập đầy đủ thông tin'
      });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    if (cleanNew.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/forgot-password', {
        phone: cleanPhone,
        newPassword: cleanNew,
        confirmPassword: cleanConfirm,
      });

      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Mật khẩu đã được thay đổi thành công!'
        });
        navigation.navigate('Login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi kết nối server";
      Toast.show({
        type: 'error',
        text1: 'Thất bại',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>iCtrlHome</Text>
        <Text style={styles.subTitle}>Khôi phục mật khẩu</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Số điện thoại đã đăng ký"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          autoCorrect={false}
        />

        <TextInput
          placeholder="Mật khẩu mới"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Xác nhận mật khẩu mới"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.button, loading && { backgroundColor: '#A5B1FF' }]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>ĐẶT LẠI MẬT KHẨU</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  logoContainer: { alignItems: 'center', marginTop: 80 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  appName: { fontSize: 22, fontWeight: '600', color: '#2D2D2D' },
  subTitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { paddingHorizontal: 32, marginTop: 30 },
  input: { backgroundColor: '#fff', borderRadius: 8, height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ccc', marginBottom: 16, color: '#333' },
  button: { backgroundColor: '#6C7CFF', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#6C7CFF', fontSize: 14, fontWeight: '500' },
});