import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../database/api';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

const ProfileScreen = ({ navigation, route }) => {
  const { theme, styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user_info');
        if (jsonValue !== null) {
          const user = JSON.parse(jsonValue);
          setFullName(user.name || '');
          setPhone(user.phone || '');
        }
      } catch (error) {
        console.log('Lỗi load dữ liệu:', error);
      }
    };
    loadUserData();
  }, []);

  const handleUpdateAll = async () => {
    if (!fullName.trim()) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.name_required,
      });
      return;
    }

    try {
      setLoading(true);

      // 🔥 Cập nhật tên (khớp với backend)
      const response = await api.post('/update-profile', {
        phone,
        name: fullName.trim(), // ✅ đổi fullName thành name
      });

      const updatedUser = response.data.user;

      // Cập nhật lại AsyncStorage
      await AsyncStorage.setItem('user_info', JSON.stringify(updatedUser));

      // 🔥 Nếu có nhập đổi mật khẩu
      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          throw new Error(t.fill_all_info);
        }

        if (newPassword !== confirmPassword) {
          throw new Error(t.password_not_match);
        }

        await api.post('/change-password', {
          phone,
          oldPassword,
          newPassword,
        });
      }

      Toast.show({
        type: 'success',
        text1: t.success,
        text2: t.profile_updated,
      });

      setTimeout(() => navigation.goBack(), 1000);
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || 'Lỗi cập nhật';

      Toast.show({
        type: 'error',
        text1: t.error,
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeStyles.primary}
      />
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <View style={styles.avatarWrapper}>
          <Image
            source={require('../../public/img/avatar.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraBtn}>
            <Text style={styles.cameraText}>{t.edit_profile}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerName}>{fullName}</Text>
        <Text style={styles.headerPhone}>{phone}</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.sectionLabel, { color: themeStyles.primary }]}>
          {t.account_info}
        </Text>
        <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>
          {t.phone}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeStyles.card,
              color: themeStyles.subText,
              borderColor: themeStyles.border,
            },
          ]}
          value={phone}
          editable={false}
        />
        <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>
          {t.full_name}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeStyles.card,
              color: themeStyles.text,
              borderColor: themeStyles.border,
            },
          ]}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor={themeStyles.subText}
        />

        <View
          style={[styles.divider, { backgroundColor: themeStyles.border }]}
        />
        <Text style={[styles.sectionLabel, { color: themeStyles.primary }]}>
          {t.change_password}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeStyles.card,
              color: themeStyles.text,
              borderColor: themeStyles.border,
            },
          ]}
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder={t.old_password}
          secureTextEntry
          placeholderTextColor={themeStyles.subText}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeStyles.card,
              color: themeStyles.text,
              borderColor: themeStyles.border,
            },
          ]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t.new_password}
          secureTextEntry
          placeholderTextColor={themeStyles.subText}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeStyles.card,
              color: themeStyles.text,
              borderColor: themeStyles.border,
            },
          ]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t.confirm_password}
          secureTextEntry
          placeholderTextColor={themeStyles.subText}
        />

        <TouchableOpacity
          style={[
            styles.btnSave,
            { backgroundColor: themeStyles.primary },
            loading && { backgroundColor: '#ccc' },
          ]}
          onPress={handleUpdateAll}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t.save_all}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnCancel}
        >
          <Text style={[styles.cancelText, { color: themeStyles.subText }]}>
            {t.back}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 35,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cameraText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerPhone: { color: '#e0f0ff', fontSize: 14 },
  form: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 15 },
  fieldLabel: { fontSize: 12, marginBottom: 5 },
  input: {
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
  },
  divider: { height: 1, marginVertical: 15 },
  btnSave: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { fontSize: 14 },
});

export default ProfileScreen;
