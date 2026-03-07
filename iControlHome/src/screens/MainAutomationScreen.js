import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  TextInput, ScrollView, Switch, ActivityIndicator, Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';

const MainAutomationScreen = ({ navigation }) => {
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
      console.log("DEVICE DEBUG:", JSON.stringify(res.data.devices, null, 2));
      
      const devData = res.data.devices || [];
      // HIỂN THỊ TẤT CẢ: Bỏ filter can_control để User thường cũng thấy thiết bị
      setDevices(devData); 
    } catch (err) {
      console.error("Lỗi tải thiết bị:", err.message);
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
      return Alert.alert("Lỗi", "Vui lòng nhập tên và chọn thiết bị");
    }
    try {
      const houseId = await AsyncStorage.getItem('current_house_id');
      const payload = {
        name: name.trim(),
        device_id: selectedDevice,
        house_id: houseId || "H001", 
        action: status ? "ON" : "OFF",
        trigger_time: moment(date).format("YYYY-MM-DD HH:mm"), 
        repeat_type: "ONCE", 
        enabled: true
      };
      const response = await api.post('/automations', payload);
      if (response.status === 201 || response.status === 200) {
        Alert.alert("Thành công", `Đã đặt lịch lúc ${moment(date).format("HH:mm - DD/MM/YYYY")}`);
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu kịch bản");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Thiết lập kịch bản</Text>
      <Text style={styles.label}>Tên kịch bản:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Tắt quạt" />

      <Text style={styles.label}>Chọn Ngày & Giờ:</Text>
      <TouchableOpacity style={styles.timePickerBtn} onPress={() => { setMode('date'); setShowPicker(true); }}>
        <View>
          <Text>🗓 {moment(date).format("DD/MM/YYYY")}</Text>
          <Text style={styles.timeText}>⏰ {moment(date).format("HH:mm")}</Text>
        </View>
        <Text style={{color: '#2196F3', fontWeight: 'bold'}}>THAY ĐỔI</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker key={mode} value={date} mode={mode} is24Hour={true} display="default" onChange={onDateTimeChange} />
      )}

      <Text style={styles.label}>Chọn thiết bị:</Text>
      <View style={styles.deviceList}>
        {devices.length > 0 ? devices.map((dev) => (
          <TouchableOpacity 
            key={dev._id} 
            style={[styles.deviceItem, selectedDevice === dev._id && styles.deviceSelected]}
            onPress={() => setSelectedDevice(dev._id)}
          >
            <Text style={{color: selectedDevice === dev._id ? '#FFF' : '#333'}}>{dev.name}</Text>
          </TouchableOpacity>
        )) : <Text style={{color: 'red'}}>Không có thiết bị.</Text>}
      </View>

      <View style={styles.switchRow}>
        <Text>Hành động: {status ? "BẬT" : "TẮT"}</Text>
        <Switch value={status} onValueChange={setStatus} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={createAuto}>
        <Text style={{color: '#FFF', fontWeight: 'bold'}}>LƯU TỰ ĐỘNG HOÁ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { marginTop: 20, fontWeight: 'bold' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 8 },
  timePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#eee', borderRadius: 8, marginTop: 10 },
  timeText: { fontSize: 22, fontWeight: 'bold' },
  deviceList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  deviceItem: { padding: 10, borderWidth: 1, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  deviceSelected: { backgroundColor: '#2196F3' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  saveBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 }
});
export default MainAutomationScreen;