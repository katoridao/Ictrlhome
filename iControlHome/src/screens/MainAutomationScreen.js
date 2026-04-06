import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';
import { LanguageContext } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const MainAutomationScreen = ({ navigation }) => {
  const { t } = useContext(LanguageContext);
  const { styles: themeStyles } = useTheme();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await api.get('/devices');
      // LOG DEBUG: Kiểm tra dữ liệu tại terminal máy tính
      console.log('DEVICE DEBUG:', JSON.stringify(res.data.devices, null, 2));

      const devData = res.data.devices || [];
      // HIỂN THỊ TẤT CẢ: Bỏ filter can_control để User thường cũng thấy thiết bị
      setDevices(devData);
    } catch (err) {
      console.error('Lỗi tải thiết bị:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateTimeChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      setMode('date');
      return;
    }
    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (Platform.OS === 'android') {
      if (mode === 'date') {
        setShowPicker(false);
        setTimeout(() => {
          setMode('time');
          setShowPicker(true);
        }, 500);
      } else {
        setShowPicker(false);
        setMode('date');
      }
    } else {
      setShowPicker(false);
    }
  };

  const createAuto = async () => {
    if (!selectedDevice || !name.trim()) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.fill_name_select_device,
      });
      return;
    }

    try {
      const houseId = await AsyncStorage.getItem('current_house_id');
      const payload = {
        name: name.trim(),
        device_id: selectedDevice,
        house_id: houseId || 'H001',
        action: status ? 'ON' : 'OFF',
        trigger_time: moment(date).format('YYYY-MM-DD HH:mm'),
        repeat_type: 'ONCE',
        enabled: true,
      };
      const response = await api.post('/automations', payload);

      if (response.status === 201 || response.status === 200) {
        Toast.show({
          type: 'success',
          text1: t.success,
          text2: `${t.automation_scheduled_success} ${moment(date).format(
            'HH:mm - DD/MM/YYYY',
          )}`,
        });
        navigation.goBack();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.automation_schedule_failed,
      });
    }
  };

  const selectedDeviceInfo = devices.find(dev => dev._id === selectedDevice);
  const actionOptions = [
    {
      value: true,
      emoji: '🟢',
      label: t.turn_on,
      description: t.automation_action_turn_on_desc,
      activeColor: '#16A34A',
    },
    {
      value: false,
      emoji: '🔴',
      label: t.turn_off,
      description: t.automation_action_turn_off_desc,
      activeColor: '#DC2626',
    },
  ];

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={themeStyles.primary}
        style={[styles.loader, { backgroundColor: themeStyles.background }]}
      />
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.headerSubtitle, { color: themeStyles.subText }]}>
        {t.automation_setup_desc}
      </Text>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: themeStyles.card,
            borderColor: themeStyles.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.script_name}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: themeStyles.border,
              backgroundColor: themeStyles.background,
              color: themeStyles.text,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder={t.automation_name_placeholder}
          placeholderTextColor={themeStyles.subText}
        />
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: themeStyles.card,
            borderColor: themeStyles.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.select_date_time}
        </Text>
        <TouchableOpacity
          style={[
            styles.timePickerBtn,
            {
              backgroundColor: themeStyles.background,
              borderColor: themeStyles.border,
            },
          ]}
          onPress={() => {
            setMode('date');
            setShowPicker(true);
          }}
        >
          <View>
            <Text style={{ color: themeStyles.text }}>
              🗓 {moment(date).format('DD/MM/YYYY')}
            </Text>
            <Text style={[styles.timeText, { color: themeStyles.text }]}>
              ⏰ {moment(date).format('HH:mm')}
            </Text>
          </View>
          <Text style={{ color: themeStyles.primary, fontWeight: 'bold' }}>
            {t.change_action}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          key={mode}
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onDateTimeChange}
        />
      )}

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: themeStyles.card,
            borderColor: themeStyles.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.select_device_action}
        </Text>
        <Text style={[styles.helperText, { color: themeStyles.subText }]}>
          {t.automation_device_hint}
        </Text>
        <View style={styles.deviceList}>
          {devices.length > 0 ? (
            devices.map(dev => (
              <TouchableOpacity
                key={dev._id}
                style={[
                  styles.deviceItem,
                  {
                    borderColor: themeStyles.border,
                    backgroundColor: themeStyles.background,
                  },
                  selectedDevice === dev._id && {
                    backgroundColor: themeStyles.primary,
                    borderColor: themeStyles.primary,
                  },
                ]}
                onPress={() => setSelectedDevice(dev._id)}
              >
                <Text
                  style={{
                    color:
                      selectedDevice === dev._id ? '#FFF' : themeStyles.text,
                    fontWeight: selectedDevice === dev._id ? '700' : '500',
                  }}
                >
                  {dev.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: '#F44336' }}>{t.no_devices_available}.</Text>
          )}
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: themeStyles.card,
            borderColor: themeStyles.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.action}
        </Text>
        <Text style={[styles.helperText, { color: themeStyles.subText }]}>
          {t.automation_action_hint}
        </Text>
        <View style={styles.actionGrid}>
          {actionOptions.map(option => {
            const isActive = status === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.actionCard,
                  {
                    borderColor: isActive
                      ? option.activeColor
                      : themeStyles.border,
                    backgroundColor: isActive
                      ? option.activeColor
                      : themeStyles.background,
                  },
                ]}
                onPress={() => setStatus(option.value)}
                activeOpacity={0.9}
              >
                <Text style={styles.actionEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.actionTitle,
                    { color: isActive ? '#FFF' : themeStyles.text },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.actionDesc,
                    { color: isActive ? '#F8FAFC' : themeStyles.subText },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.previewCard,
          {
            backgroundColor: themeStyles.card,
            borderColor: themeStyles.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.automation_preview_title}
        </Text>
        <Text style={[styles.previewLine, { color: themeStyles.text }]}>
          {t.script_name}: {name.trim() || t.not_updated}
        </Text>
        <Text style={[styles.previewLine, { color: themeStyles.text }]}>
          {t.device}: {selectedDeviceInfo?.name || t.no_devices_available}
        </Text>
        <Text style={[styles.previewLine, { color: themeStyles.text }]}>
          {t.action}: {status ? t.turn_on : t.turn_off}
        </Text>
        <Text style={[styles.previewLine, { color: themeStyles.text }]}>
          {t.select_date_time}: {moment(date).format('HH:mm • DD/MM/YYYY')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: themeStyles.primary }]}
        onPress={createAuto}
      >
        <Text style={styles.saveBtnText}>{t.save_automation}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  loader: { flex: 1 },
  headerSubtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  sectionCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  helperText: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  timePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  timeText: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  deviceList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  deviceItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 120,
  },
  actionEmoji: { fontSize: 22, marginBottom: 10 },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionDesc: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  previewCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  previewLine: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
export default MainAutomationScreen;
