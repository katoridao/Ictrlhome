import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../database/api';
import { LanguageContext } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { registerNotificationToken } from '../services/notificationService';

const LoginScreen = ({ navigation }) => {
  const { t, changeLanguage } = useContext(LanguageContext);
  const { changeTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials khi component mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedPhone = await AsyncStorage.getItem('saved_phone');
        const savedPassword = await AsyncStorage.getItem('saved_password');
        const savedRemember = await AsyncStorage.getItem('remember_me');

        if (savedPhone && savedPassword) {
          setPhone(savedPhone);
          setPassword(savedPassword);
          setRememberMe(savedRemember === 'true');
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || !password) {
      Toast.show({
        type: 'error',
        text1: t.notification,
        text2: t.fill_all_info,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', {
        phone: cleanPhone,
        password,
      });

      if (response.status === 200 && response.data.token) {
        const userData = response.data.user;

        const userMatched = {
          _id: userData._id, // FIX: lưu _id để các màn hình khác dùng
          phone: userData.phone,
          name: userData.name || '',
          role: userData.role || 'MEMBER',
          settings: {
            theme: userData.settings?.theme || 'LIGHT',
            language: userData.settings?.language || 'VI',
          },
          notification_settings: userData.notification_settings || {},
        };

        // Lưu token để các request sau tự động đính kèm Authorization header
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user_info', JSON.stringify(userMatched));
        await AsyncStorage.setItem('phone', userMatched.phone);
        await AsyncStorage.setItem('user_role', userMatched.role);

        // Lưu credentials nếu "Nhớ mật khẩu" được chọn
        if (rememberMe) {
          await AsyncStorage.setItem('saved_phone', phone);
          await AsyncStorage.setItem('saved_password', password);
          await AsyncStorage.setItem('remember_me', 'true');
        } else {
          // Xóa saved credentials nếu không chọn "Nhớ mật khẩu"
          await AsyncStorage.removeItem('saved_phone');
          await AsyncStorage.removeItem('saved_password');
          await AsyncStorage.removeItem('remember_me');
        }

        // FIX: Luôn lưu house_id = "H001" vì backend đang hardcode H001
        const houseId = response.data.house_id || 'H001';
        const houseName = response.data.house_name || 'NHÀ CHÍNH';
        await AsyncStorage.setItem('current_house_id', houseId);
        await AsyncStorage.setItem('current_house_name', houseName);

        // Sync app settings with this account immediately after login.
        await changeTheme(userMatched.settings.theme, { syncRemote: false });
        await changeLanguage(
          userMatched.settings.language === 'EN' ? 'en' : 'vi',
          { syncRemote: false },
        );

        try {
          await registerNotificationToken();
        } catch (notificationError) {
          console.warn(
            '[Login] Không thể đăng ký FCM token:',
            notificationError?.message,
          );
        }

        Toast.show({
          type: 'success',
          text1: t.success,
          text2: `${t.welcome} ${userMatched.name || userMatched.phone}!`,
        });

        navigation.replace('Main');
      } else {
        const errorMsg = response.data?.message || t.invalid_server_response;
        console.error('Invalid response:', response.data);
        Toast.show({ type: 'error', text1: t.error, text2: errorMsg });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t.server_connection_error;
      console.error('Login error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        errorFull: error.message,
      });
      Toast.show({ type: 'error', text1: t.error, text2: errorMessage });
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
        <View style={styles.logoBox}>
          <Image
            source={require('../../public/img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{t.login}</Text>
        </View>

        <View style={styles.input}>
          <TextInput
            placeholder={t.enter_phone}
            placeholderTextColor="#666"
            style={styles.textInput}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
        </View>

        <View style={styles.input}>
          <TextInput
            placeholder={t.enter_password}
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showText}>
              {showPassword ? t.hide : t.show}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.rememberContainer}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <MaterialCommunityIcons
            name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={20}
            color={rememberMe ? '#7C8CFF' : '#999'}
          />
          <Text style={styles.rememberText}>{t.remember_password}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{t.continue}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text
            style={styles.register}
            onPress={() => navigation.navigate('Register')}
          >
            {t.create_account}
          </Text>
          <Text
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            {t.forgot_password}
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  container: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  logoBox: { alignItems: 'center', padding: 10, marginBottom: 10 },
  logo: { width: 150, height: 150 },
  appName: { fontSize: 22, fontWeight: '600', color: '#333' },
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  rememberText: {
    color: '#555',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: { alignItems: 'center', marginTop: 40 },
  register: { color: '#3A8DFF', fontWeight: '600', marginBottom: 6 },
  forgot: { color: '#555', fontSize: 13 },
});

export default LoginScreen;
