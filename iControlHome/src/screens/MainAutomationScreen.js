import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';
import { LanguageContext } from '../context/LanguageContext';

const MainAutomationScreen = ({ navigation }) => {
  const { t } = useContext(LanguageContext);
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
      return Alert.alert(t.error, t.fill_name_select_device);
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
        Alert.alert(
          t.success,
          `${t.select_date_time}: ${moment(date).format('HH:mm - DD/MM/YYYY')}`,
        );
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(t.error, t.fill_name_select_device);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>{t.automation_setup}</Text>
      <Text style={styles.label}>{t.script_name}:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t.automation_name_placeholder}
      />

      <Text style={styles.label}>{t.select_date_time}:</Text>
      <TouchableOpacity
        style={styles.timePickerBtn}
        onPress={() => {
          setMode('date');
          setShowPicker(true);
        }}
      >
        <View>
          <Text>🗓 {moment(date).format('DD/MM/YYYY')}</Text>
          <Text style={styles.timeText}>⏰ {moment(date).format('HH:mm')}</Text>
        </View>
        <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>
          {t.change_action}
        </Text>
      </TouchableOpacity>

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

      <Text style={styles.label}>{t.select_device_action}:</Text>
      <View style={styles.deviceList}>
        {devices.length > 0 ? (
          devices.map(dev => (
            <TouchableOpacity
              key={dev._id}
              style={[
                styles.deviceItem,
                selectedDevice === dev._id && styles.deviceSelected,
              ]}
              onPress={() => setSelectedDevice(dev._id)}
            >
              <Text
                style={{ color: selectedDevice === dev._id ? '#FFF' : '#333' }}
              >
                {dev.name}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: 'red' }}>{t.no_devices_available}.</Text>
        )}
      </View>

      <View style={styles.switchRow}>
        <Text>
          {t.action}: {status ? t.on : t.off}
        </Text>
        <Switch value={status} onValueChange={setStatus} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={createAuto}>
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          {t.save_automation}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { marginTop: 20, fontWeight: 'bold' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 8 },
  timePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginTop: 10,
  },
  timeText: { fontSize: 22, fontWeight: 'bold' },
  deviceList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  deviceItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  deviceSelected: { backgroundColor: '#2196F3' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
});
export default MainAutomationScreen;
