import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';

const WelcomeScreen = ({ navigation }) => {
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const rememberMe = await AsyncStorage.getItem('remember_me');

        // Nếu có token và remember_me được bật, thì auto-login
        if (token && rememberMe === 'true') {
          try {
            // Validate token bằng cách gọi một endpoint
            const response = await api.get('/profile');
            if (response.status === 200) {
              // Token valid, navigate to Main
              navigation.replace('Main');
              return;
            }
          } catch (error) {
            // Token expired hoặc invalid: try auto-login using stored credentials
            console.warn('Token expired or invalid, attempting auto-login');
            await AsyncStorage.removeItem('token');
            if (rememberMe === 'true') {
              const savedPhone = await AsyncStorage.getItem('saved_phone');
              const savedPassword = await AsyncStorage.getItem(
                'saved_password',
              );
              if (savedPhone && savedPassword) {
                try {
                  const res = await api.post('/login', {
                    phone: savedPhone,
                    password: savedPassword,
                  });
                  if (res.status === 200 && res.data.token) {
                    await AsyncStorage.setItem('token', res.data.token);
                    navigation.replace('Main');
                    return;
                  }
                } catch (e) {
                  console.warn('Auto-login failed', e.message);
                }
              }
            }
            // if we reach here, we won't navigate; fallback to login screen after timeout
          }
        }
      } catch (error) {
        console.error('Error checking auto-login:', error);
      }

      // Sau 2 giây, nếu chưa navigate thì đi tới Login
      const timer = setTimeout(() => {
        navigation.replace('Login');
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkAutoLogin();
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={require('../../public/img/background.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Image
            source={require('../../public/img/logo.png')}
            style={styles.logo}
          />
        </View>
      </ImageBackground>
    </View>
  );
};

export default WelcomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 14,
  },
});
