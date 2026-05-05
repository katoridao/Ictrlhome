import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';

export default function JoinHouseScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);
  const [adminPhone, setAdminPhone] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!adminPhone.trim() || !joinPassword) {
      Toast.show({ type: 'error', text1: t.error, text2: t.fill_all_info });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/houses/join', {
        admin_phone: adminPhone.trim(),
        join_password: joinPassword,
      });

      const houseId = response.data?.house_id || 'H001';
      const ownerName = response.data?.owner_name || t.home;
      const successMessage = (
        t.join_house_success_with_owner || t.join_house_success
      ).replace('{owner}', ownerName);

      Toast.show({
        type: 'success',
        text1: t.success,
        text2: successMessage,
        visibilityTime: 2500,
      });

      await AsyncStorage.setItem('current_house_id', houseId);
      await AsyncStorage.setItem('current_house_name', ownerName);

      // Reload lại user_info để cập nhật trạng thái member
      const userInfo = await AsyncStorage.getItem('user_info');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        user.is_house_member = true;
        await AsyncStorage.setItem('user_info', JSON.stringify(user));
      }

      setTimeout(() => navigation.replace('Main'), 1500);
    } catch (error) {
      const msg = error.response?.data?.message || t.cannot_join_house;
      Toast.show({ type: 'error', text1: t.error, text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeStyles.primary}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.join_house_title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {/* Icon minh hoạ */}
        <View
          style={[
            styles.iconBox,
            { backgroundColor: themeStyles.primary + '18' },
          ]}
        >
          <Text style={styles.iconEmoji}>🏠</Text>
        </View>

        <Text style={[styles.title, { color: themeStyles.text }]}>
          {t.admin_info}
        </Text>
        <Text style={[styles.subtitle, { color: themeStyles.subText }]}>
          {t.contact_admin}
        </Text>

        {/* Form */}
        <View style={[styles.formBox, { backgroundColor: themeStyles.card }]}>
          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.admin_phone}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: themeStyles.text,
                borderColor: themeStyles.border || '#ddd',
              },
            ]}
            placeholder={t.enter_phone}
            placeholderTextColor={themeStyles.subText}
            value={adminPhone}
            onChangeText={setAdminPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.join_password}
          </Text>
          <View
            style={[
              styles.passwordRow,
              { borderColor: themeStyles.border || '#ddd' },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: themeStyles.text }]}
              placeholder={t.join_password}
              placeholderTextColor={themeStyles.subText}
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ color: themeStyles.primary, fontSize: 13 }}>
                {showPassword ? t.hide : t.show}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.joinBtn,
            { backgroundColor: themeStyles.primary },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinBtnText}>{t.join_house_btn}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        >
          <Text style={[styles.cancelText, { color: themeStyles.subText }]}>
            {t.cancel_action}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  body: { flex: 1, padding: 24, alignItems: 'center' },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  iconEmoji: { fontSize: 42 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  formBox: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    marginBottom: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: { flex: 1, fontSize: 14 },
  joinBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 16 },
  cancelText: { fontSize: 14 },
});
