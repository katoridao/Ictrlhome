import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import axios from 'axios';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ email");
      return;
    }

    try {
      const response = await axios.post('http://192.168.56.2:3000/api/forgot-password', {
        email: email.toLowerCase().trim()
      });

      if (response.status === 200) {
        Alert.alert("Thành công", response.data.message);
        navigation.navigate('Login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi kết nối server";
      Alert.alert("Thất bại", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>iCtrlHome</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Nhập email đã đăng ký"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
          <Text style={styles.buttonText}>GỬI MẬT KHẨU MỚI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  form: {
    paddingHorizontal: 32,
    marginTop: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#6C7CFF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    color: '#6C7CFF',
    fontSize: 14,
    fontWeight: '500',
  },
});