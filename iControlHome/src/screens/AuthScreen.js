import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // --- XỬ LÝ ĐĂNG NHẬP (GIẢ LẬP) ---
  const handleAuthentication = () => {
    // Bỏ qua mọi kiểm tra, chuyển thẳng vào màn hình chính
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {}
      <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
        <Text style={styles.buttonText}>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</Text>
      </TouchableOpacity>

      {isLogin && (
        <View style={styles.socialContainer}>
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>Hoặc đăng nhập bằng</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialButtonsRow}>
            {}
            <TouchableOpacity 
              style={styles.socialBtn} 
              onPress={handleAuthentication} 
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} 
                style={styles.socialIcon} 
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialBtn, { marginLeft: 15 }]} 
              onPress={() => Alert.alert('Thông báo', 'Tính năng Facebook đang phát triển')}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png' }} 
                style={styles.socialIcon} 
              />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchContainer}>
        <Text style={styles.switchText}>
          {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  socialContainer: { marginTop: 20 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#ccc' },
  orText: { marginHorizontal: 10, color: '#666' },
  socialButtonsRow: { flexDirection: 'row', justifyContent: 'center' },
  socialBtn: { 
    flexDirection: 'row', backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 20, 
    borderRadius: 8, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, elevation: 2,
  },
  socialIcon: { width: 24, height: 24, marginRight: 10 },
  socialText: { fontWeight: 'bold', color: '#333' },
  switchContainer: { marginTop: 30, alignItems: 'center' },
  switchText: { color: '#007BFF' },
});

export default AuthScreen;