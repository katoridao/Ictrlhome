import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../database/api';
import { LanguageContext } from '../context/LanguageContext';

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useContext(LanguageContext);

  const handleResetPassword = async () => {
    const cleanPhone = phone.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPhone || !cleanNew || !cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: t.notification,
        text2: t.fill_all_info,
      });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.password_not_match,
      });
      return;
    }

    if (cleanNew.length < 6) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.min_password_length,
      });
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/forgot-password', {
        phone: cleanPhone,
        newPassword: cleanNew,
        confirmPassword: cleanConfirm,
      });

      Toast.show({
        type: 'success',
        text1: t.success,
        text2: response.data.message || t.reset_password,
      });

      navigation.navigate('Login');
    } catch (error) {
      console.log('RESET ERROR:', error?.response?.data || error.message);

      Toast.show({
        type: 'error',
        text1: t.error,
        text2: error?.response?.data?.message || t.server_connection_error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../public/img/background.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.overlay} />
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
          <Text style={styles.appName}>{t.forgot_password_title}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder={t.registered_phone}
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            autoCorrect={false}
          />

          <TextInput
            placeholder={t.new_password_set}
            placeholderTextColor="#888"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />

          <TextInput
            placeholder={t.confirm_new_password}
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
              <Text style={styles.buttonText}>{t.reset_password}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>{t.back_to_login}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  container: { flex: 1 },
  logoContainer: { alignItems: 'center', marginTop: 80 },
  logo: { width: 150, height: 150, marginBottom: 10 },
  appName: { fontSize: 22, fontWeight: '600', color: '#2D2D2D' },
  subTitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { paddingHorizontal: 32, marginTop: 30 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#6C7CFF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#6C7CFF', fontSize: 14, fontWeight: '500' },
});
