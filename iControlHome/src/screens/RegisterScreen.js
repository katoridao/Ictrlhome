import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.appName}>iCtrlHome</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          placeholder="Nhập tài khoản"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showText}>Hiện</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirm}
            style={styles.passwordInput}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.showText}>Hiện</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>

        <Text style={styles.forgotText}>Quên mật khẩu</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#A8C0FF',
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },

  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },

  appName: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },

  form: {
    paddingHorizontal: 24,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  passwordInput: {
    flex: 1,
  },

  showText: {
    color: '#3B82F6',
    fontWeight: '500',
  },

  button: {
    backgroundColor: '#6C7CFF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  loginText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 8,
  },

  forgotText: {
    color: '#555',
    fontSize: 13,
  },
});
