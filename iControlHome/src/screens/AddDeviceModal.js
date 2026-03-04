import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../database/api';

const DEVICE_TYPES = [
  { label: 'Đèn', value: 'light', icon: 'lightbulb-on' },
  { label: 'Quạt', value: 'fan', icon: 'fan' },
  { label: 'Ổ cắm', value: 'socket', icon: 'power-socket-eu' },
  { label: 'Cảm biến', value: 'sensor', icon: 'molecule' },
];

const AddDeviceModal = ({ navigation, route }) => {
  // Kiểm tra xem có device truyền vào không để xác định chế độ Sửa
  const editDevice = route.params?.device;
  const isEditMode = !!editDevice;

  // State quản lý danh sách phòng và phòng đang chọn
  const [rooms, setRooms] = useState([]);
  // Ưu tiên lấy ID từ params (Home truyền sang) hoặc từ thiết bị cũ (khi sửa)
  const [selectedRoomId, setSelectedRoomId] = useState(route.params?.room_id || route.params?.roomId || editDevice?.room_id || editDevice?.roomId || null);
  
  const [name, setName] = useState(editDevice?.name || '');
  const [type, setType] = useState(editDevice?.type || 'light');
  const [esp32Id, setEsp32Id] = useState(editDevice?.esp32Id || '');
  const [powerWatt, setPowerWatt] = useState(editDevice?.power_watt ? String(editDevice.power_watt) : '');
  const [loading, setLoading] = useState(false);

  // Tải danh sách phòng khi mở màn hình
  useEffect(() => {
    const checkHouseAndFetchRooms = async () => {
      try {
        // 1. Kiểm tra xem đã chọn nhà chưa
        const houseId = await AsyncStorage.getItem('current_house_id');
        if (!houseId) {
          Alert.alert(
            "Chưa chọn nhà",
            "Bạn cần chọn hoặc tạo nhà trước khi thêm thiết bị.",
            [
              { text: "Hủy", style: "cancel", onPress: () => navigation.goBack() },
              { text: "Chọn Nhà", onPress: () => navigation.navigate('SelectHouse') }
            ]
          );
          return;
        }

        const response = await api.get('/rooms');
        const data = response.data;
        if (Array.isArray(data)) {
          setRooms(data);
        } else if (data && data.rooms) {
          setRooms(data.rooms);
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.log("Lỗi tải danh sách phòng:", error);
      }
    };
    checkHouseAndFetchRooms();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !esp32Id.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      // Lấy user_id từ AsyncStorage
      const userJson = await AsyncStorage.getItem('user_info');
      const user = userJson ? JSON.parse(userJson) : {};
      if (!user?._id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      // Lấy house_id hiện tại
      const houseId = await AsyncStorage.getItem('current_house_id');
      if (!houseId) {
        Alert.alert("Lỗi", "Vui lòng chọn nhà trước khi lưu.");
        setLoading(false);
        return;
      }

      // Nếu là Sửa dùng PUT tới /devices/:id, nếu Thêm dùng POST tới /devices
      const payload = { 
        room_id: selectedRoomId, // Sử dụng ID phòng người dùng đã chọn (hoặc null)
        name: name.trim(), 
        type, 
        esp32Id: esp32Id.trim(),
        power_watt: parseInt(powerWatt) || 0,
        user_id: user._id,
        house_id: houseId, // Gửi kèm house_id để đảm bảo thêm đúng nhà
        status: 0 // FIX: Mặc định trạng thái là TẮT (0) để không bị tính điện năng ngay khi tạo
      };

      let response;
      if (isEditMode) {
        response = await api.put(`/devices/${editDevice._id}`, payload);
      } else {
        response = await api.post('/devices', payload);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Thành công", isEditMode ? "Đã cập nhật thông tin!" : "Đã thêm thiết bị mới!");
        navigation.goBack(); 
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi server";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {}
          <Text style={styles.header}>{isEditMode ? "Chỉnh Sửa Thiết Bị" : "Thêm Thiết Bị Mới"}</Text>
          
          <Text style={styles.label}>Tên thiết bị</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ví dụ: Đèn phòng khách" 
            value={name} 
            onChangeText={setName} 
          />

          <Text style={styles.label}>Chọn phòng (Tùy chọn)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomList}>
            {/* Tùy chọn: Chưa có phòng (Null) */}
            <TouchableOpacity 
              style={[styles.roomChip, selectedRoomId === null && styles.roomChipActive]}
              onPress={() => setSelectedRoomId(null)}
            >
              <Text style={[styles.roomText, selectedRoomId === null && styles.roomTextActive]}>Chưa có phòng</Text>
            </TouchableOpacity>

            {/* Danh sách các phòng từ API */}
            {Array.isArray(rooms) && rooms.map((room) => (
              <TouchableOpacity 
                key={room._id}
                style={[styles.roomChip, selectedRoomId === room._id && styles.roomChipActive]}
                onPress={() => setSelectedRoomId(room._id)}
              >
                <Text style={[styles.roomText, selectedRoomId === room._id && styles.roomTextActive]}>{room.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.label}>Chọn loại thiết bị</Text>
          <View style={styles.typeRow}>
            {DEVICE_TYPES.map((item) => (
              <TouchableOpacity 
                key={item.value}
                style={[styles.typeButton, type === item.value && styles.typeButtonActive]}
                onPress={() => setType(item.value)}
              >
                <MaterialCommunityIcons name={item.icon} size={24} color={type === item.value ? '#fff' : '#555'} />
                <Text style={[styles.typeText, type === item.value && styles.typeTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Công suất (W)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ví dụ: 50" 
            value={powerWatt} 
            onChangeText={setPowerWatt} 
            keyboardType="numeric"
          />

          <Text style={styles.label}>ID ESP32</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ví dụ: ESP32_01" 
            value={esp32Id} 
            onChangeText={setEsp32Id} 
            autoCapitalize="characters" 
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{isEditMode ? "Cập nhật" : "Lưu thiết bị"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#2196F3', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 10, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, backgroundColor: '#f8f9fa' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  typeButton: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginHorizontal: 4 },
  typeButtonActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  typeText: { fontSize: 11, marginTop: 5 },
  typeTextActive: { color: '#fff', fontWeight: 'bold' },
  roomList: { flexDirection: 'row', marginBottom: 10 },
  roomChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  roomChipActive: { backgroundColor: '#e3f2fd', borderColor: '#2196F3' },
  roomText: { color: '#555', fontSize: 13 },
  roomTextActive: { color: '#2196F3', fontWeight: '600' },
  footer: { flexDirection: 'row', marginTop: 40, gap: 15 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  saveBtn: { flex: 2, backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default AddDeviceModal;