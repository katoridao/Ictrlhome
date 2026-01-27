import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Logo */}
      <View style={styles.logoBox}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>iCtrlHome</Text>
      </View>

      {/* Input username */}
      <View style={styles.input}>
        <TextInput
          placeholder="Nhập tài khoản"
          placeholderTextColor="#666"
          style={styles.textInput}
        />
      </View>

      {/* Input password */}
      <View style={styles.input}>
        <TextInput
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#666"
          secureTextEntry={!showPassword}
          style={styles.textInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
        </TouchableOpacity>
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.buttonText}>TIẾP TỤC</Text>
      </TouchableOpacity>

      {/* Footer */}
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
    </>
  );
};

export default LoginScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },

  logoBox: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 30,
  },

  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },

  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

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

  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  showText: {
    color: '#3A8DFF',
    fontSize: 13,
  },

  button: {
    backgroundColor: '#7C8CFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  footer: {
    alignItems: 'center',
    marginTop: 40,
  },

  register: {
    color: '#3A8DFF',
    fontWeight: '600',
    marginBottom: 6,
  },

  forgot: {
    color: '#555',
    fontSize: 13,
  },
});
