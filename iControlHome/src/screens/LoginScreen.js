import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageBackground,
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
        text2: 'Vui lòng nhập đầy đủ thông tin',
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
          text2: 'Chào mừng bạn quay trở lại!',
        });

        navigation.replace('Main');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Lỗi kết nối server';
      Toast.show({
        type: 'error',
        text1: 'Thất bại',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../public/img/background.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.overlay} />
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Image
            source={require('../../public/img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text
            style={styles.register}
            onPress={() => navigation.navigate('Register')}
          >
            ĐĂNG KÝ TÀI KHOẢN
          </Text>
          <Text
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            Quên mật khẩu
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoBox: { alignItems: 'center', padding: 10, marginBottom: 10 },
  logo: { width: 150, height: 150, marginBottom: 8 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 46,
  },
  textInput: { flex: 1, fontSize: 14, color: '#333' },
  showText: { color: '#3A8DFF', fontSize: 13 },
  button: {
    backgroundColor: '#7C8CFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  footer: { alignItems: 'center', marginTop: 40 },
  register: { color: '#3A8DFF', fontWeight: '600', marginBottom: 6 },
  forgot: { color: '#555', fontSize: 13 },
});
