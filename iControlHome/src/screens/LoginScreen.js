import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../database/api'; 

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanPhone || !cleanPassword) {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập đầy đủ thông tin'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', {
        phone: cleanPhone,
        password: cleanPassword,
      });

      if (response.status === 200) {
        const user = response.data.user;
        await AsyncStorage.setItem('user_info', JSON.stringify(user));
        
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Chào mừng bạn quay trở lại!'
        });

        navigation.replace('Main');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi kết nối server';
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
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.logoBox}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>iCtrlHome</Text>
      </View>

      <View style={styles.input}>
        <TextInput
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#666"
          style={styles.textInput}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoCorrect={false}
        />
      </View>

      <View style={styles.input}>
        <TextInput
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#666"
          secureTextEntry={!showPassword}
          style={styles.textInput}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && { backgroundColor: '#A5B1FF' }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.register}>ĐĂNG KÝ TÀI KHOẢN</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Quên mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', backgroundColor: '#F5F5F5' },
  logoBox: { alignItems: 'center', padding: 24, marginBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 8 },
  logoText: { fontSize: 18, fontWeight: '600', color: '#333' },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 12, marginBottom: 14, height: 46 },
  textInput: { flex: 1, fontSize: 14, color: '#333' },
  showText: { color: '#3A8DFF', fontSize: 13 },
  button: { backgroundColor: '#7C8CFF', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  footer: { alignItems: 'center', marginTop: 40 },
  register: { color: '#3A8DFF', fontWeight: '600', marginBottom: 6 },
  forgot: { color: '#555', fontSize: 13 },
});