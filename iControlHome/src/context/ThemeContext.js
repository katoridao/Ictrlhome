import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';

const ThemeContext = createContext();

export const themeColors = {
  LIGHT: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    primary: '#3B9CFF',
    border: '#E9ECEF',
    subText: '#6C757D',
  },
  DARK: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    primary: '#3B9CFF',
    border: '#2C2C2C',
    subText: '#B0B0B0',
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('LIGHT');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const userInfoRaw = await AsyncStorage.getItem('user_info');
        if (userInfoRaw) {
          const userInfo = JSON.parse(userInfoRaw);
          const userTheme = userInfo?.settings?.theme;
          if (userTheme === 'LIGHT' || userTheme === 'DARK') {
            setTheme(userTheme);
            await AsyncStorage.setItem('user_theme', userTheme);
            return;
          }
        }

        const savedTheme = await AsyncStorage.getItem('user_theme');
        if (savedTheme === 'LIGHT' || savedTheme === 'DARK') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.warn('[ThemeContext] Failed to load theme:', error?.message);
      }
    };
    loadTheme();
  }, []);

  const changeTheme = async (newTheme, options = {}) => {
    const { syncRemote = true } = options;
    setTheme(newTheme);
    await AsyncStorage.setItem('user_theme', newTheme);

    try {
      const userInfoRaw = await AsyncStorage.getItem('user_info');
      if (userInfoRaw) {
        const userInfo = JSON.parse(userInfoRaw);
        const updatedUserInfo = {
          ...userInfo,
          settings: {
            theme: newTheme,
            language: userInfo?.settings?.language || 'VI',
          },
        };
        await AsyncStorage.setItem(
          'user_info',
          JSON.stringify(updatedUserInfo),
        );
      }
    } catch (error) {
      console.warn(
        '[ThemeContext] Failed to save local theme:',
        error?.message,
      );
    }

    if (!syncRemote) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      await api.post('/update-settings', { theme: newTheme });
    } catch (error) {
      console.warn('[ThemeContext] Failed to sync theme:', error?.message);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, changeTheme, styles: themeColors[theme] }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
