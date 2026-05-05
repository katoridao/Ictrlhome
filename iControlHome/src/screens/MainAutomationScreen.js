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
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await api.get('/devices');
      // LOG DEBUG: Kiểm tra dữ liệu tại terminal máy tính
      console.log('DEVICE DEBUG:', JSON.stringify(res.data.devices, null, 2));

      const devData = res.data.devices || [];
      const controllableDevices = devData.filter(dev => dev.can_control);
      setDevices(controllableDevices);
      if (!selectedDevice && controllableDevices.length > 0) {
        setSelectedDevice(controllableDevices[0]._id);
      }
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

    if (devices.length === 0) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.no_devices_available,
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
      const forbidden = err?.response?.status === 403;

      Toast.show({
        type: 'error',
        text1: t.error,
        text2: forbidden
          ? t.automation_permission_denied
          : t.automation_schedule_failed,
      });
    }
  };

  const selectedDeviceInfo = devices.find(dev => dev._id === selectedDevice);
  const actionOptions = [
    {
      value: true,
      emoji: '🟢',
      label: t.automation_action_turn_on_desc,
      description: t.automation_action_turn_on_desc,
      activeColor: '#16A34A',
    },
    {
      value: false,
      emoji: '🔴',
      label: t.automation_action_turn_off_desc,
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
        {devices.length > 0 ? (
          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                {
                  borderColor: deviceDropdownOpen
                    ? themeStyles.primary
                    : themeStyles.border,
                  backgroundColor: themeStyles.background,
                },
              ]}
              onPress={() => setDeviceDropdownOpen(prev => !prev)}
              activeOpacity={0.85}
            >
              <View style={styles.dropdownTriggerContent}>
                <Text
                  style={[styles.dropdownLabel, { color: themeStyles.subText }]}
                >
                  {t.device}
                </Text>
                <Text
                  style={[styles.dropdownValue, { color: themeStyles.text }]}
                >
                  {selectedDeviceInfo?.name || t.select_device_action}
                </Text>
              </View>
              <Text
                style={[
                  styles.dropdownArrow,
                  {
                    color: themeStyles.primary,
                    transform: [
                      { rotate: deviceDropdownOpen ? '180deg' : '0deg' },
                    ],
                  },
                ]}
              >
                ▼
              </Text>
            </TouchableOpacity>

            {deviceDropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    borderColor: themeStyles.border,
                    backgroundColor: themeStyles.background,
                  },
                ]}
              >
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {devices.map(dev => {
                    const isSelected = selectedDevice === dev._id;
                    return (
                      <TouchableOpacity
                        key={dev._id}
                        style={[
                          styles.dropdownItem,
                          {
                            borderColor: isSelected
                              ? `${themeStyles.primary}55`
                              : 'transparent',
                            backgroundColor: isSelected
                              ? `${themeStyles.primary}1A`
                              : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          setSelectedDevice(dev._id);
                          setDeviceDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            {
                              color: isSelected
                                ? themeStyles.primary
                                : themeStyles.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {dev.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: '#F44336' }}>{t.no_devices_available}.</Text>
        )}
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
        <View style={styles.actionTabs}>
          {actionOptions.map(option => {
            const isActive = status === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.actionTab,
                  {
                    borderColor: isActive
                      ? option.activeColor
                      : themeStyles.border,
                    backgroundColor: isActive
                      ? `${option.activeColor}20`
                      : themeStyles.background,
                  },
                ]}
                onPress={() => setStatus(option.value)}
                activeOpacity={0.9}
              >
                <Text style={styles.actionEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.actionTabTitle,
                    { color: isActive ? option.activeColor : themeStyles.text },
                  ]}
                >
                  {option.label}
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
        style={[
          styles.saveBtn,
          { backgroundColor: themeStyles.primary },
          (devices.length === 0 || loading) && { opacity: 0.6 },
        ]}
        onPress={createAuto}
        disabled={devices.length === 0 || loading}
      >
        <Text style={styles.saveBtnText}>{t.save_automation}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 20, paddingTop: 5 },
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
  dropdownWrap: { marginTop: 6 },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerContent: { flex: 1, paddingRight: 10 },
  dropdownLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  dropdownValue: { fontSize: 15, fontWeight: '700' },
  dropdownArrow: { fontSize: 12, fontWeight: '700' },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
  },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dropdownItemText: { fontSize: 14 },
  actionTabs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 22, marginBottom: 8 },
  actionTabTitle: { fontSize: 14, fontWeight: '700' },
  actionDetailCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  actionDetailTitle: { fontSize: 14, fontWeight: '700' },
  actionDetailDesc: { fontSize: 12, lineHeight: 18, marginTop: 6 },
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
