import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

// DEVICE_TYPES will be created dynamically with translations in the component

const AddDeviceModal = ({ navigation, route }) => {
  const { t } = useContext(LanguageContext);
  const { styles: themeStyles } = useTheme();
  const DEVICE_TYPES = [
    { label: t.device_type_light, value: 'light', icon: 'lightbulb-on' },
    { label: t.device_type_fan, value: 'fan', icon: 'fan' },
  ];
  const editDevice = route.params?.device;
  const isEditMode = !!editDevice;

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(
    route.params?.room_id ||
      route.params?.roomId ||
      editDevice?.room_id ||
      editDevice?.roomId ||
      null,
  );
  const [name, setName] = useState(editDevice?.name || '');
  const [type, setType] = useState(editDevice?.type || 'light');
  const [esp32Ip, setEsp32Ip] = useState(editDevice?.esp32_ip || '');
  const [powerWatt, setPowerWatt] = useState(
    editDevice?.power_watt ? String(editDevice.power_watt) : '',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const houseId = await AsyncStorage.getItem('current_house_id');
        if (!houseId) {
          // Giữ lại: đây là confirm dialog cần người dùng chọn hành động
          Alert.alert(t.no_house_selected, t.no_house_selected_message, [
            {
              text: t.cancel_action,
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: t.select_house,
              onPress: () => navigation.navigate('SelectHouse'),
            },
          ]);
          return;
        }
        const response = await api.get('/rooms');
        const data = response.data;
        setRooms(Array.isArray(data) ? data : data?.rooms || []);
      } catch (error) {
        console.log('Lỗi tải danh sách phòng:', error);
      }
    };
    fetchRooms();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: t.notification,
        text2: t.fill_all_info,
      });
      return;
    }

    setLoading(true);
    try {
      const houseId =
        (await AsyncStorage.getItem('current_house_id')) || 'H001';
      const payload = {
        room_id: selectedRoomId,
        name: name.trim(),
        type,
        esp32_ip: esp32Ip.trim() || null,
        power_watt: parseInt(powerWatt) || 0,
        house_id: houseId,
        status: false,
      };

      let response;
      if (isEditMode) {
        response = await api.put(`/devices/${editDevice._id}`, payload);
      } else {
        response = await api.post('/devices', payload);
      }

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: 'success',
          text1: t.success,
          text2: isEditMode ? t.device_updated_success : t.device_added_success,
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: error.response?.data?.message || t.server_error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeStyles.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          style={{ backgroundColor: themeStyles.background }}
        >
          <Text style={[styles.header, { color: themeStyles.primary }]}>
            {isEditMode ? t.edit_device : t.add_new_device}
          </Text>

          <Text style={[styles.label, { color: themeStyles.text }]}>
            {t.device_name}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.card,
                color: themeStyles.text,
              },
            ]}
            placeholder={t.device_name_placeholder}
            placeholderTextColor={themeStyles.subText}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: themeStyles.text }]}>
            {t.select_room}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roomList}
          >
            <TouchableOpacity
              style={[
                styles.roomChip,
                {
                  backgroundColor: themeStyles.card,
                  borderColor: themeStyles.border,
                },
                selectedRoomId === null && styles.roomChipActive,
                selectedRoomId === null && {
                  backgroundColor: `${themeStyles.primary}22`,
                  borderColor: themeStyles.primary,
                },
              ]}
              onPress={() => setSelectedRoomId(null)}
            >
              <Text
                style={[
                  styles.roomText,
                  { color: themeStyles.subText },
                  selectedRoomId === null && styles.roomTextActive,
                  selectedRoomId === null && { color: themeStyles.primary },
                ]}
              >
                {t.no_rooms}
              </Text>
            </TouchableOpacity>
            {rooms.map(room => (
              <TouchableOpacity
                key={room._id}
                style={[
                  styles.roomChip,
                  {
                    backgroundColor: themeStyles.card,
                    borderColor: themeStyles.border,
                  },
                  selectedRoomId === room._id && styles.roomChipActive,
                  selectedRoomId === room._id && {
                    backgroundColor: `${themeStyles.primary}22`,
                    borderColor: themeStyles.primary,
                  },
                ]}
                onPress={() => setSelectedRoomId(room._id)}
              >
                <Text
                  style={[
                    styles.roomText,
                    { color: themeStyles.subText },
                    selectedRoomId === room._id && styles.roomTextActive,
                    selectedRoomId === room._id && {
                      color: themeStyles.primary,
                    },
                  ]}
                >
                  {room.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: themeStyles.text }]}>
            {t.select_device_type}
          </Text>
          <View style={styles.typeRow}>
            {DEVICE_TYPES.map(item => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeButton,
                  {
                    borderColor: themeStyles.border,
                    backgroundColor: themeStyles.card,
                  },
                  type === item.value && styles.typeButtonActive,
                  type === item.value && {
                    backgroundColor: themeStyles.primary,
                    borderColor: themeStyles.primary,
                  },
                ]}
                onPress={() => setType(item.value)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={type === item.value ? '#fff' : themeStyles.subText}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: themeStyles.subText },
                    type === item.value && styles.typeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: themeStyles.text }]}>
            {t.power_consumption}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.card,
                color: themeStyles.text,
              },
            ]}
            placeholder={t.power_consumption_placeholder}
            placeholderTextColor={themeStyles.subText}
            value={powerWatt}
            onChangeText={setPowerWatt}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: themeStyles.text }]}>
            {t.device_ip}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.card,
                color: themeStyles.text,
              },
            ]}
            placeholder={t.device_ip_placeholder}
            placeholderTextColor={themeStyles.subText}
            value={esp32Ip}
            onChangeText={setEsp32Ip}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text
                style={[styles.cancelBtnText, { color: themeStyles.subText }]}
              >
                {t.cancel_action}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: themeStyles.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isEditMode ? t.update_device : t.save_device}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 10, marginTop: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  typeButtonActive: {},
  typeText: { fontSize: 11, marginTop: 5 },
  typeTextActive: { color: '#fff', fontWeight: 'bold' },
  roomList: { flexDirection: 'row', marginBottom: 10 },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  roomChipActive: {},
  roomText: { fontSize: 13 },
  roomTextActive: { fontWeight: '600' },
  footer: { flexDirection: 'row', marginTop: 40, gap: 15 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelBtnText: { fontSize: 15 },
  saveBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AddDeviceModal;
