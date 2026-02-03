import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themeColors = {
  LIGHT: {
    background: '#F8F9FA', 
    card: '#FFFFFF',
    text: '#212529',       
    primary: '#3B9CFF',    
    border: '#E9ECEF',
    subText: '#6C757D'
  },
  DARK: {
    background: '#121212', 
    card: '#1E1E1E',       
    text: '#FFFFFF',       
    primary: '#3B9CFF',    
    border: '#2C2C2C',     
    subText: '#B0B0B0'     
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('LIGHT');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('user_theme');
      if (savedTheme) setTheme(savedTheme);
    };
    loadTheme();
  }, []);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('user_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, styles: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);