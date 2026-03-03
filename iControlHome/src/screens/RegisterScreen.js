import React, { useState, useEffect } from 'react'; // Khai báo đủ Hooks
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../database/api';

export default function RegisterScreen({ navigation }) {
  // --- QUY TẮC: TẤT CẢ HOOKS PHẢI ĐẶT Ở ĐÂY (CẤP CAO NHẤT) ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu bạn có useEffect nào đó, phải đặt ở đây, TRƯỚC các hàm logic
  useEffect(() => {
    // Để trống hoặc logic khởi tạo nếu cần
  }, []);

  // --- SAU ĐÓ MỚI ĐẾN CÁC HÀM XỬ LÝ ---
  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Thông báo', text2: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/register', {
        name: cleanName,
        phone: cleanPhone,
        password,
      });

      if (response.status === 200 || response.status === 201) {
        const userData = response.data.user;

        // Ăn khớp với Schema User: role, settings
        const userMatched = {
          phone: userData?.phone || cleanPhone,
          name: userData?.name || cleanName,
          role: userData?.role || "OWNER", 
          settings: {
            theme: userData?.settings?.theme || "LIGHT",
            language: userData?.settings?.language || "VI",
          }
        };

        await AsyncStorage.setItem('user_info', JSON.stringify(userMatched));
        await AsyncStorage.setItem('phone', userMatched.phone);
        await AsyncStorage.setItem('user_role', userMatched.role);

        Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đăng ký thành công!' });
        navigation.navigate('Login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi kết nối server';
      Toast.show({ type: 'error', text1: 'Thất bại', text2: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // --- CUỐI CÙNG LÀ PHẦN GIAO DIỆN ---
  return (
    <ImageBackground source={require('../../public/img/background.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
          <Image source={require('../../public/img/logo.png')} style={styles.logo} />
          <Text style={styles.appName}>Đăng ký tài khoản</Text>
        </View>

        <View style={styles.form}>
          <TextInput 
            placeholder="Nhập họ tên" 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            editable={!loading} 
          />
          <TextInput 
            placeholder="Nhập số điện thoại" 
            style={styles.input} 
            keyboardType="phone-pad" 
            value={phone} 
            onChangeText={setPhone} 
            editable={!loading} 
          />

          <View style={styles.passwordBox}>
            <TextInput
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordBox}>
            <TextInput
              placeholder="Xác nhận mật khẩu"
              secureTextEntry={!showConfirm}
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.showText}>{showConfirm ? 'Ẩn' : 'Hiện'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>TIẾP TỤC</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.loginText}>ĐĂNG NHẬP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.85)' },
  logoContainer: { alignItems: 'center', marginTop: 80 },
  logo: { width: 150, height: 150, resizeMode: 'contain' },
  appName: { fontSize: 22, fontWeight: '600', color: '#333' },
  form: { paddingHorizontal: 24 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, height: 48, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  passwordBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, height: 48, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  passwordInput: { flex: 1 },
  showText: { color: '#3B82F6', fontWeight: '500' },
  button: { backgroundColor: '#6C7CFF', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  footer: { alignItems: 'center', marginBottom: 40 },
  loginText: { color: '#3B82F6', fontWeight: '600' },
});