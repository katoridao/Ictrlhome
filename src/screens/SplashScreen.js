import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setTimeout(() => {
        if (user) {
          navigation.replace('Home');
        } else {
          navigation.replace('Auth');
        }
      }, 1500);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MY APP LOGO</Text>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: '#333' },
});

export default SplashScreen;