import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput, Alert, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function RoomScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Lấy house_id hiện tại để lọc phòng
      const houseId = await AsyncStorage.getItem('current_house_id');
      
      const response = await api.get('/rooms', { params: { house_id: houseId } });
      const data = response.data;
      if (data && data.rooms) {
        setRooms(data.rooms);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Lỗi lấy phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRooms(); }, []));

  const handleSave = async () => {
    if (!roomName.trim()) return;
    try {
      if (isEdit && selectedRoomId) {
        await api.put(`/rooms/${selectedRoomId}`, { name: roomName });
      } else {
        const houseId = await AsyncStorage.getItem('current_house_id');
        if (!houseId) {
          Alert.alert("Lỗi", "Vui lòng chọn nhà trước khi tạo phòng.");
          return;
        }
        await api.post('/rooms', { 
          name: roomName, 
          house_id: houseId
        });
      }
      setModalVisible(false);
      setRoomName('');
      fetchRooms();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu phòng");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Xác nhận", "Xóa phòng này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
          try { await api.delete(`/rooms/${id}`); fetchRooms(); } catch (e) { Alert.alert("Lỗi", "Không thể xóa"); }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Phòng</Text>
        <TouchableOpacity onPress={() => { setIsEdit(false); setRoomName(''); setModalVisible(true); }}>
          <Image source={require('../../public/img/add.png')} style={{ width: 22, height: 22, tintColor: '#fff' }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={themeStyles.primary} />
        ) : rooms.map((room) => (
          <RoomItem 
            key={room._id} 
            room={room} 
            themeStyles={themeStyles} 
            navigation={navigation} 
            onEdit={() => { setIsEdit(true); setSelectedRoomId(room._id); setRoomName(room.name); setModalVisible(true); }} 
            onDelete={() => handleDelete(room._id)} 
          />
        ))}

        <View style={[styles.sectionBox, { backgroundColor: themeStyles.card }]}>
          <Text style={[styles.sectionText, { color: themeStyles.text }]}>Được chia sẻ</Text>
        </View>
      </ScrollView>

      {/* Modal Thêm/Sửa */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.modalBox, { backgroundColor: themeStyles.card }]}>
                <Text style={[styles.modalTitle, { color: themeStyles.text }]}>{isEdit ? 'Sửa tên phòng' : 'Thêm phòng'}</Text>
                <TextInput 
                  placeholder="Nhập tên phòng" 
                  placeholderTextColor={themeStyles.subText} 
                  style={[styles.input, { color: themeStyles.text, borderColor: themeStyles.border }]} 
                  value={roomName} 
                  onChangeText={setRoomName} 
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10 }}>
                    <Text style={{ color: themeStyles.subText }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={{ padding: 10 }}>
                    <Text style={{ color: themeStyles.primary, fontWeight: 'bold' }}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

function RoomItem({ room, onEdit, onDelete, themeStyles, navigation }) {
  return (
    <TouchableOpacity 
      style={[styles.roomItem, { backgroundColor: themeStyles.card }]} 
      onPress={() => navigation.navigate('RoomDetail', { room })}
    >
      <Text style={[styles.roomName, { color: themeStyles.text }]}>{room.name}</Text>
      
      <View style={styles.roomActions}>
        {/* Nút Xóa */}
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); onDelete(); }}>
          <Image source={require('../../public/img/delete.png')} style={[styles.icon, { tintColor: '#f52109' }]} />
        </TouchableOpacity>
        
        {/* Nút Sửa */}
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEdit(); }}>
          <Image source={require('../../public/img/edit.png')} style={[styles.icon, { marginLeft: 12, tintColor: '#f52109' }]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 70, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  sortText: { color: '#fff' },
  body: { padding: 16 },
  roomItem: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16 },
  roomActions: { flexDirection: 'row' },
  icon: { width: 20, height: 20 },
  sectionBox: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 16 }
});