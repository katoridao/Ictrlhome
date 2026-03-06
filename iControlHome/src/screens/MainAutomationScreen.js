import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, TextInput, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Switch // Thêm Switch ở đây
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import api from '../database/api'; 

const MainAutomationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 1. Thêm State để lưu trạng thái Bật hoặc Tắt
  const [status, setStatus] = useState(true); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, devRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/devices')
      ]);
      setNotifications(notifRes.data.notifications || []); 
      setDevices(devRes.data.devices || []); 
    } catch (err) {
      console.error("Lỗi tải dữ liệu", err);
    } finally {
      setLoading(false);
    }
  };

  const createAuto = async () => {
    if (!selectedDevice || !time || !name) {
      return Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin!");
    }
    try {
      const houseId = await AsyncStorage.getItem('current_house_id');

      const payload = {
        name: name,
        time: time,
        house_id: houseId, 
        action: { 
          device_id: selectedDevice, 
          // 2. Truyền biến status động (true/false) thay vì để true cố định
          status: status 
        }
      };

      const response = await api.post('/automations', payload);
      
      if (response.status === 201 || response.status === 200) {
        Alert.alert("Thành công", `Đã lưu kịch bản ${status ? 'Bật' : 'Tắt'}!`);
        navigation.goBack();
      }
    } catch (err) {
      console.log("Lỗi gửi kịch bản:", err.response?.data || err.message);
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể lưu kịch bản");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Tạo kịch bản mới</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tên kịch bản (VD: Tắt điện phòng khách)" />
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="Giờ chạy (HH:mm - VD: 22:00)" keyboardType="numbers-and-punctuation" />
          
          <Text style={styles.label}>Chọn thiết bị ({devices.length}):</Text>
          <View style={{ height: 60, marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {devices.length > 0 ? devices.map((dev) => (
                <TouchableOpacity 
                  key={dev._id}
                  style={[styles.devCard, selectedDevice === dev._id && styles.activeCard]}
                  onPress={() => setSelectedDevice(dev._id)}
                >
                  <Text style={[styles.devText, selectedDevice === dev._id && styles.activeText]}>{dev.name}</Text>
                </TouchableOpacity>
              )) : <Text style={{color: '#999', marginTop: 10}}>Không có thiết bị khả dụng</Text>}
            </ScrollView>
          </View>

          {/* 3. THÊM PHẦN CHỌN BẬT HOẶC TẮT Ở ĐÂY */}
          <View style={styles.switchSection}>
            <Text style={styles.switchLabel}>Hành động khi đến giờ: <Text style={{color: status ? '#2196F3' : '#FF4444', fontWeight: 'bold'}}>{status ? 'BẬT' : 'TẮT'}</Text></Text>
            <Switch
              trackColor={{ false: "#767577", true: "#bbdefb" }}
              thumbColor={status ? "#2196F3" : "#f4f3f4"}
              onValueChange={() => setStatus(previousState => !previousState)}
              value={status}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={createAuto}>
            <Text style={styles.saveButtonText}>LƯU KỊCH BẢN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    formSection: { padding: 15, backgroundColor: '#FFF', elevation: 3 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginBottom: 10 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    input: { backgroundColor: '#F0F2F5', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
    devCard: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF', marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: '#2196F3', justifyContent: 'center' },
    activeCard: { backgroundColor: '#2196F3' },
    devText: { color: '#2196F3', fontWeight: '500' },
    activeText: { color: '#FFF' },
    // Style mới cho phần Switch
    switchSection: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: '#F8F9FA', 
      padding: 15, 
      borderRadius: 10, 
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#ECEFF1'
    },
    switchLabel: { fontSize: 15, color: '#333' },
    saveButton: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default MainAutomationScreen;