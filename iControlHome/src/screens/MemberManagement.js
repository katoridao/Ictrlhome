import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Switch, ActivityIndicator, Alert, TextInput, SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

/**
 * MÀN HÌNH 1: DANH SÁCH THÀNH VIÊN
 */
export const ManageMembersScreen = ({ navigation }) => {
  const { styles: themeStyles } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const houseId = await AsyncStorage.getItem('current_house_id') || 'H001';
      const response = await api.get(`/houses/${houseId}`);
      setMembers(response.data.members || []);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải danh sách thành viên.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAddMember = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập số điện thoại' });
      return;
    }
    setAdding(true);
    try {
      const response = await api.post('/houses/add-member', { phone: cleanPhone });
      Toast.show({ type: 'success', text1: 'Thành công', text2: response.data.message });
      setPhone('');
      setMembers(response.data.house.members || []);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.message || 'Không thể thêm thành viên' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = (member) => {
    // Giữ lại: đây là confirm dialog cần người dùng xác nhận
    Alert.alert('Xóa thành viên', `Bạn có chắc muốn xóa ${member.name || member.phone}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            const response = await api.delete('/houses/remove-member', { data: { member_id: member._id } });
            setMembers(response.data.house.members || []);
            Toast.show({ type: 'success', text1: 'Đã xóa', text2: `${member.name || member.phone} đã bị xóa khỏi nhà.` });
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.message || 'Không thể xóa' });
          }
        }
      }
    ]);
  };

  const renderMemberItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
      <View style={[styles.avatarCircle, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
      </View>
      <TouchableOpacity style={styles.memberInfo} onPress={() => navigation.navigate('MemberPermission', { member: item })}>
        <Text style={[styles.memberName, { color: themeStyles.text }]}>{item.name || 'Thành viên'}</Text>
        <Text style={[styles.memberPhone, { color: themeStyles.subText }]}>{item.phone}</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MemberPermission', { member: item })}>
          <MaterialCommunityIcons name="shield-account" size={22} color={themeStyles.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemoveMember(item)}>
          <MaterialCommunityIcons name="account-remove" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={[styles.addBox, { backgroundColor: themeStyles.card }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Thêm thành viên</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: themeStyles.text, borderColor: themeStyles.subText }]}
            placeholder="Nhập số điện thoại..."
            placeholderTextColor={themeStyles.subText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: themeStyles.primary }, adding && { opacity: 0.7 }]}
            onPress={handleAddMember}
            disabled={adding}
          >
            {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Thêm</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: themeStyles.text, marginHorizontal: 16 }]}>
        Danh sách thành viên ({members.length})
      </Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có thành viên nào.</Text>}
        onRefresh={fetchMembers}
        refreshing={loading}
      />
    </SafeAreaView>
  );
};

/**
 * MÀN HÌNH 2: PHÂN QUYỀN (PHÒNG + THIẾT BỊ ĐƠN LẺ)
 */
export const MemberPermissionScreen = ({ route }) => {
  const { member } = route.params;
  const { styles: themeStyles } = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const houseId = await AsyncStorage.getItem('current_house_id') || 'H001';
      const [roomsRes, devicesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/devices', { params: { house_id: houseId } }),
      ]);

      const rooms = roomsRes.data.rooms || [];
      const allDevices = devicesRes.data.devices || [];
      const builtSections = [];

      for (const room of rooms) {
        const roomPerm = room.permissions?.find(
          (p) => p.user_id === member._id || p.user_id?.toString() === member._id
        );
        const devicesInRoom = allDevices.filter(
          (d) => d.room_id?.toString() === room._id?.toString()
        );
        builtSections.push({
          roomId: room._id,
          title: room.name,
          type: 'room',
          roomPerm: { can_control: roomPerm?.can_control ?? false },
          data: devicesInRoom.map((d) => {
            const dp = d.permissions?.find(
              (p) => p.user_id === member._id || p.user_id?.toString() === member._id
            );
            return { ...d, devicePerm: { can_control: dp?.can_control ?? false } };
          }),
        });
      }

      const unassigned = allDevices.filter((d) => !d.room_id);
      if (unassigned.length > 0) {
        builtSections.push({
          roomId: null,
          title: 'Thiết bị chưa gán phòng',
          type: 'unassigned',
          roomPerm: null,
          data: unassigned.map((d) => {
            const dp = d.permissions?.find(
              (p) => p.user_id === member._id || p.user_id?.toString() === member._id
            );
            return { ...d, devicePerm: { can_control: dp?.can_control ?? false } };
          }),
        });
      }

      setSections(builtSections);
    } catch (error) {
      console.error('Lỗi:', error);
    } finally {
      setLoading(false);
    }
  }, [member._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleRoomPermission = async (roomId, field, currentValue) => {
    const key = `room_${roomId}_${field}`;
    setUpdatingId(key);
    try {
      const newValue = !currentValue;
      await api.post(`/rooms/assign-permission/${roomId}`, {
        member_id: member._id,
        [field]: newValue,
      });
      setSections((prev) => prev.map((s) => {
        if (s.roomId?.toString() !== roomId?.toString()) return s;
        return { ...s, roomPerm: { ...s.roomPerm, [field]: newValue } };
      }));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể cập nhật quyền phòng' });
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleDevicePermission = async (deviceId, currentValue) => {
    setUpdatingId(deviceId);
    try {
      const newValue = !currentValue;
      await api.post(`/devices/${deviceId}/assign-permission`, {
        member_id: member._id,
        can_control: newValue,
      });
      setSections((prev) => prev.map((s) => ({
        ...s,
        data: s.data.map((d) =>
          d._id === deviceId ? { ...d, devicePerm: { can_control: newValue } } : d
        ),
      })));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể cập nhật quyền thiết bị' });
    } finally {
      setUpdatingId(null);
    }
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: themeStyles.background }]}>
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons
          name={section.type === 'unassigned' ? 'devices' : 'door'}
          size={18} color={themeStyles.primary}
        />
        <Text style={[styles.sectionHeaderText, { color: themeStyles.text }]}>{section.title}</Text>
      </View>
      {section.type === 'room' && section.roomPerm !== null && (
        <View style={styles.roomToggles}>
          <View style={styles.toggleGroup}>
            <Text style={[styles.toggleLabel, { color: themeStyles.subText }]}>Điều khiển</Text>
            {updatingId === `room_${section.roomId}_can_control` ? (
              <ActivityIndicator size="small" color={themeStyles.primary} />
            ) : (
              <Switch
                value={section.roomPerm.can_control}
                onValueChange={() => toggleRoomPermission(section.roomId, 'can_control', section.roomPerm.can_control)}
                trackColor={{ true: '#A5D6A7' }}
                thumbColor={section.roomPerm.can_control ? '#4CAF50' : '#ccc'}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderDevice = ({ item, section }) => (
    <View style={[styles.card, styles.deviceCard, { backgroundColor: themeStyles.card }]}>
      <View style={styles.memberInfo}>
        <Text style={[styles.deviceName, { color: themeStyles.text }]}>{item.name}</Text>
        <Text style={{ color: themeStyles.subText, fontSize: 11 }}>
          {item.type ? item.type.toUpperCase() : 'UNKNOWN'}
          {section.type === 'room' && section.roomPerm?.can_control ? '  •  Có quyền từ phòng' : ''}
        </Text>
      </View>
      <View style={styles.toggleGroup}>
        <Text style={[styles.toggleLabel, { color: themeStyles.subText }]}>Riêng lẻ</Text>
        {updatingId === item._id ? (
          <ActivityIndicator size="small" color={themeStyles.primary} />
        ) : (
          <Switch
            value={item.devicePerm.can_control}
            onValueChange={() => toggleDevicePermission(item._id, item.devicePerm.can_control)}
            trackColor={{ true: '#A5D6A7' }}
            thumbColor={item.devicePerm.can_control ? '#4CAF50' : '#ccc'}
          />
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.background }]}>
        <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={[styles.memberHeader, { backgroundColor: themeStyles.card }]}>
        <View style={[styles.avatarCircle, { backgroundColor: themeStyles.primary }]}>
          <Text style={styles.avatarText}>{member.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View>
          <Text style={[styles.memberName, { color: themeStyles.text }]}>{member.name || 'Thành viên'}</Text>
          <Text style={[styles.memberPhone, { color: themeStyles.subText }]}>{member.phone}</Text>
        </View>
      </View>

      <View style={[styles.noteBox, { backgroundColor: themeStyles.card }]}>
        <MaterialCommunityIcons name="information-outline" size={16} color={themeStyles.primary} />
        <Text style={[styles.noteText, { color: themeStyles.subText }]}>
          Cấp quyền theo phòng sẽ áp dụng cho tất cả thiết bị trong phòng. Toggle "Riêng lẻ" để cấp thêm quyền cho thiết bị ngoài phòng.
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có phòng hoặc thiết bị nào.</Text>}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  addBox: { margin: 16, borderRadius: 14, padding: 16, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  addBtn: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, elevation: 2 },
  deviceCard: { marginLeft: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  memberHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, margin: 16, borderRadius: 14, elevation: 2 },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: 'bold' },
  memberPhone: { fontSize: 13, marginTop: 2 },
  deviceName: { fontSize: 14, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4, marginTop: 8 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sectionHeaderText: { fontSize: 15, fontWeight: '700' },
  roomToggles: { flexDirection: 'row', gap: 12 },
  toggleGroup: { alignItems: 'center', gap: 2 },
  toggleLabel: { fontSize: 10, fontWeight: '600' },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 10 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});