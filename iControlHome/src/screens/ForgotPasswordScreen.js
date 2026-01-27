import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';

export default function ForgotPasswordScreen() {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>iCtrlHome</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          placeholder="Nhập email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View style={{ height: 80 }} />
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
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
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
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
});
