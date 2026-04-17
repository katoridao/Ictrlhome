import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { unregisterNotificationToken } from '../services/notificationService';
import api from '../database/api';

export default function SettingScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const { theme, styles: themeStyles } = useTheme();
  const { t, language } = useContext(LanguageContext);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const jsonValue = await AsyncStorage.getItem('user_info');
          if (jsonValue !== null) {
            const user = JSON.parse(jsonValue);

            try {
              const membershipResponse = await api.get('/houses/check-member');
              const nextUser = {
                ...user,
                is_house_member: membershipResponse.data?.is_member === true,
              };
              setUserData(nextUser);
              await AsyncStorage.setItem('user_info', JSON.stringify(nextUser));
            } catch (membershipError) {
              setUserData(user);
            }
          }
        } catch (e) {
          console.error('Lỗi lấy dữ liệu:', e);
        }
      };
      loadUserData();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert(t.logout_title, t.logout_msg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        onPress: async () => {
          await unregisterNotificationToken();
          await AsyncStorage.multiRemove([
            'user_info',
            'phone',
            'current_house_id',
            'current_house_name',
            'token',
            'saved_phone',
            'saved_password',
            'remember_me',
          ]);
          navigation.replace('Login');
        },
      },
    ]);
  };

  const hasHouseAccess =
    userData?.role === 'OWNER' || userData?.is_house_member === true;

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Image
          source={require('../../public/img/setting.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{t.settings}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity
          style={[styles.userBox, { backgroundColor: themeStyles.card }]}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('Profile', {
              phone: userData?.phone,
              name: userData?.name,
            })
          }
        >
          <Image
            source={require('../../public/img/avatar.png')}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: themeStyles.text }]}>
              {userData?.name || t.loading}
            </Text>
            <Text style={[styles.userPhone, { color: themeStyles.text }]}>
              {userData?.phone || t.not_updated}
            </Text>
          </View>
          <Image
            source={require('../../public/img/arrow-right.png')}
            style={[styles.arrow, { tintColor: themeStyles.subText }]}
          />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.section_app}</Text>
        <View
          style={[styles.sectionBox, { backgroundColor: themeStyles.card }]}
        >
          <SettingItem
            icon={require('../../public/img/notification.png')}
            label={t.notifications}
            textColor={themeStyles.text}
            onPress={() => navigation.navigate('NotificationSetting')}
          />
          <SettingItem
            icon={require('../../public/img/moon.png')}
            label={t.appearance}
            value={theme === 'DARK' ? t.dark : t.light}
            textColor={themeStyles.text}
            onPress={() => navigation.navigate('AppearanceScreen')}
          />
          <SettingItem
            icon={require('../../public/img/language.png')}
            label={t.language}
            value={language === 'vi' ? t.vietnamese : t.english}
            noBorder
            textColor={themeStyles.text}
            onPress={() => navigation.navigate('LanguageSetting')}
          />
        </View>

        <Text style={styles.sectionTitle}>{t.section_people}</Text>
        <View
          style={[styles.sectionBox, { backgroundColor: themeStyles.card }]}
        >
          {hasHouseAccess ? (
            <>
              <SettingItem
                icon={require('../../public/img/device_usage.png')}
                label={t.statistics}
                textColor={themeStyles.text}
                onPress={() => navigation.navigate('StatisticsScreen')}
              />
              <SettingItem
                icon={require('../../public/img/user.png')}
                label={t.face_list}
                textColor={themeStyles.text}
                onPress={() => navigation.navigate('PeopleScreen')}
              />
              <SettingItem
                icon={require('../../public/img/history.png')}
                label={t.entry_exit_history}
                textColor={themeStyles.text}
                onPress={() => navigation.navigate('EntryExitScreen')}
                noBorder
              />
            </>
          ) : (
            <SettingItem
              icon={require('../../public/img/user.png')}
              label={t.join_house}
              value={t.not_joined_house}
              textColor={themeStyles.text}
              onPress={() => navigation.navigate('JoinHouse')}
              noBorder
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.section_other}</Text>
        <View
          style={[styles.sectionBox, { backgroundColor: themeStyles.card }]}
        >
          {/* <SettingItem
            icon={require('../../public/img/help.png')}
            label={t.help}
            textColor={themeStyles.text}
          /> */}
          <SettingItem
            icon={require('../../public/img/logout.png')}
            label={t.logout}
            noBorder
            textColor={themeStyles.text}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ icon, label, value, noBorder, onPress, textColor }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.item,
        noBorder && { borderBottomWidth: 0 },
        { borderBottomColor: '#f0f0f033' },
      ]}
    >
      <Image source={icon} style={styles.itemIcon} />
      <Text style={[styles.itemText, { color: textColor }]}>{label}</Text>
      {value && <Text style={styles.valueText}>{value}</Text>}
      <Image
        source={require('../../public/img/arrow-right.png')}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: { padding: 16, paddingBottom: 40 },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  avatar: { width: 50, height: 50, borderRadius: 26, marginRight: 14 },
  userName: { fontSize: 18, fontWeight: '700' },
  userPhone: { fontSize: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBox: { borderRadius: 16, marginBottom: 20, elevation: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  itemIcon: { width: 22, height: 22, marginRight: 14, tintColor: '#3b9cff' },
  itemText: { flex: 1, fontSize: 16 },
  valueText: { fontSize: 14, color: '#999', marginRight: 6 },
  arrow: { width: 14, height: 14, tintColor: '#bbb' },
});
