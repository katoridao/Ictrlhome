import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import vi from '../languages/vi';
import en from '../languages/en';
import api from '../database/api';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('vi');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const userInfoRaw = await AsyncStorage.getItem('user_info');
        if (userInfoRaw) {
          const userInfo = JSON.parse(userInfoRaw);
          const userLanguage = userInfo?.settings?.language;
          if (userLanguage === 'VI' || userLanguage === 'EN') {
            const normalized = userLanguage === 'EN' ? 'en' : 'vi';
            setLanguage(normalized);
            await AsyncStorage.setItem('language', normalized);
            return;
          }
        }

        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage === 'vi' || savedLanguage === 'en') {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn(
          '[LanguageContext] Failed to load language:',
          error?.message,
        );
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (lang, options = {}) => {
    const { syncRemote = true } = options;
    const normalizedLang = lang === 'en' ? 'en' : 'vi';
    const backendLanguage = normalizedLang === 'en' ? 'EN' : 'VI';

    setLanguage(normalizedLang);
    await AsyncStorage.setItem('language', normalizedLang);

    try {
      const userInfoRaw = await AsyncStorage.getItem('user_info');
      if (userInfoRaw) {
        const userInfo = JSON.parse(userInfoRaw);
        const updatedUserInfo = {
          ...userInfo,
          settings: {
            theme: userInfo?.settings?.theme || 'LIGHT',
            language: backendLanguage,
          },
        };
        await AsyncStorage.setItem(
          'user_info',
          JSON.stringify(updatedUserInfo),
        );
      }
    } catch (error) {
      console.warn(
        '[LanguageContext] Failed to save local language:',
        error?.message,
      );
    }

    if (!syncRemote) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      await api.post('/update-settings', { language: backendLanguage });
    } catch (error) {
      console.warn(
        '[LanguageContext] Failed to sync language:',
        error?.message,
      );
    }
  };

  const t = language === 'vi' ? vi : en;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
