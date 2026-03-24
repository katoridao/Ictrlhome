import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

/**
 * MÀN HÌNH 1: DANH SÁCH THÀNH VIÊN
 */
export const ManageMembersScreen = ({ navigation }) => {
  const { styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const houseId =
        (await AsyncStorage.getItem('current_house_id')) || 'H001';
      const response = await api.get(`/houses/${houseId}`);
      setMembers(response.data.members || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.cannot_load_members,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ✅ Socket setup for real-time member updates
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const onMemberAdded = ({ member }) => {
        if (!mounted) return;
        console.log('[ManageMembers] New member added:', member._id);
        // Fetch members again to update the list with complete data
        fetchMembers();
      };

      const onMemberRemoved = ({ member_id }) => {
        if (!mounted) return;
        console.log('[ManageMembers] Member removed:', member_id);
        setMembers(prev => prev.filter(m => m._id !== member_id));
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socket.off('member_added').on('member_added', onMemberAdded);
          socket.off('member_removed').on('member_removed', onMemberRemoved);
          console.log('[ManageMembers] Socket listeners registered');
        } catch (err) {
          console.error('[ManageMembers] Socket setup error:', err);
        }
      };

      setupSocket();

      return () => {
        mounted = false;
        const socket = getSocket();
        if (socket) {
          socket.off('member_added');
          socket.off('member_removed');
        }
      };
    }, [fetchMembers]),
  );

  const handleAddMember = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.enter_phone,
      });
      return;
    }
    setAdding(true);
    try {
      const response = await api.post('/houses/add-member', {
        phone: cleanPhone,
      });
      Toast.show({
        type: 'success',
        text1: t.success,
        text2: response.data.message,
      });
      setPhone('');
      setMembers(response.data.house.members || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: error.response?.data?.message || t.cannot_add_member,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = member => {
    // Giữ lại: đây là confirm dialog cần người dùng xác nhận
    Alert.alert(
      t.delete_member_title,
      t.confirm_delete_member.replace('{name}', member.name || member.phone),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/houses/remove-member', {
                data: { member_id: member._id },
              });
              setMembers(response.data.house.members || []);
              Toast.show({
                type: 'success',
                text1: t.success,
                text2: t.member_removed_msg.replace(
                  '{name}',
                  member.name || member.phone,
                ),
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: t.error,
                text2: error.response?.data?.message || t.cannot_add_member,
              });
            }
          },
        },
      ],
    );
  };

  const renderMemberItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
      <View
        style={[styles.avatarCircle, { backgroundColor: themeStyles.primary }]}
      >
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.memberInfo}
        onPress={() =>
          navigation.navigate('MemberPermission', { member: item })
        }
      >
        <Text style={[styles.memberName, { color: themeStyles.text }]}>
          {item.name || t.default_member_name}
        </Text>
        <Text style={[styles.memberPhone, { color: themeStyles.subText }]}>
          {item.phone}
        </Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate('MemberPermission', { member: item })
          }
        >
          <MaterialCommunityIcons
            name="shield-account"
            size={22}
            color={themeStyles.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRemoveMember(item)}
        >
          <MaterialCommunityIcons
            name="account-remove"
            size={22}
            color="#F44336"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <View style={[styles.addBox, { backgroundColor: themeStyles.card }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          {t.add_member}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { color: themeStyles.text, borderColor: themeStyles.subText },
            ]}
            placeholder={t.enter_phone_to_add}
            placeholderTextColor={themeStyles.subText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: themeStyles.primary },
              adding && { opacity: 0.7 },
            ]}
            onPress={handleAddMember}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>{t.add}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { color: themeStyles.text, marginHorizontal: 16 },
        ]}
      >
        {t.member_list} ({members.length})
      </Text>
      <FlatList
        data={members}
        keyExtractor={item => item._id}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t.no_members}</Text>
        }
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
  const { t } = useContext(LanguageContext);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const houseId =
        (await AsyncStorage.getItem('current_house_id')) || 'H001';
      const [roomsRes, devicesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/devices', { params: { house_id: houseId } }),
      ]);

      const rooms = roomsRes.data.rooms || [];
      const allDevices = devicesRes.data.devices || [];
      const builtSections = [];

      for (const room of rooms) {
        const roomPerm = room.permissions?.find(
          p => p.user_id === member._id || p.user_id?.toString() === member._id,
        );
        const devicesInRoom = allDevices.filter(
          d => d.room_id?.toString() === room._id?.toString(),
        );
        builtSections.push({
          roomId: room._id,
          title: room.name,
          type: 'room',
          roomPerm: { can_control: roomPerm?.can_control ?? false },
          data: devicesInRoom.map(d => {
            const dp = d.permissions?.find(
              p =>
                p.user_id === member._id ||
                p.user_id?.toString() === member._id,
            );
            return {
              ...d,
              devicePerm: { can_control: dp?.can_control ?? false },
            };
          }),
        });
      }

      const unassigned = allDevices.filter(d => !d.room_id);
      if (unassigned.length > 0) {
        builtSections.push({
          roomId: null,
          title: t.unassigned_devices,
          type: 'unassigned',
          roomPerm: null,
          data: unassigned.map(d => {
            const dp = d.permissions?.find(
              p =>
                p.user_id === member._id ||
                p.user_id?.toString() === member._id,
            );
            return {
              ...d,
              devicePerm: { can_control: dp?.can_control ?? false },
            };
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Socket setup for real-time permission updates
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const onPermissionUpdated = ({
        device_id,
        room_id,
        user_id,
        can_control,
        can_view,
      }) => {
        if (!mounted || user_id !== member._id) return;
        console.log('[MemberPermission] Permission updated:', {
          device_id,
          room_id,
          user_id,
        });

        setSections(prev =>
          prev.map(section => {
            // Update device permission
            if (device_id) {
              return {
                ...section,
                data: section.data.map(d =>
                  d._id === device_id
                    ? { ...d, devicePerm: { can_control } }
                    : d,
                ),
              };
            }
            // Update room permission
            if (room_id && section.roomId?.toString() === room_id) {
              return {
                ...section,
                roomPerm: { can_control: can_control ?? can_view ?? false },
              };
            }
            return section;
          }),
        );
      };

      const onPermissionRemoved = ({ device_id, room_id, user_id }) => {
        if (!mounted || user_id !== member._id) return;
        console.log('[MemberPermission] Permission removed:', {
          device_id,
          room_id,
          user_id,
        });

        setSections(prev =>
          prev.map(section => {
            // Remove device permission
            if (device_id) {
              return {
                ...section,
                data: section.data.map(d =>
                  d._id === device_id
                    ? { ...d, devicePerm: { can_control: false } }
                    : d,
                ),
              };
            }
            // Remove room permission
            if (room_id && section.roomId?.toString() === room_id) {
              return {
                ...section,
                roomPerm: { can_control: false },
              };
            }
            return section;
          }),
        );
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socket
            .off('permission_updated')
            .on('permission_updated', onPermissionUpdated);
          socket
            .off('permission_removed')
            .on('permission_removed', onPermissionRemoved);
          console.log('[MemberPermission] Socket listeners registered');
        } catch (err) {
          console.error('[MemberPermission] Socket setup error:', err);
        }
      };

      setupSocket();

      return () => {
        mounted = false;
        const socket = getSocket();
        if (socket) {
          socket.off('permission_updated');
          socket.off('permission_removed');
        }
      };
    }, [member._id]),
  );

  const toggleRoomPermission = async (roomId, field, currentValue) => {
    const key = `room_${roomId}_${field}`;
    setUpdatingId(key);
    try {
      const newValue = !currentValue;
      await api.post(`/rooms/assign-permission/${roomId}`, {
        member_id: member._id,
        [field]: newValue,
      });
      setSections(prev =>
        prev.map(s => {
          if (s.roomId?.toString() !== roomId?.toString()) return s;
          return { ...s, roomPerm: { ...s.roomPerm, [field]: newValue } };
        }),
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.cannot_update_permission,
      });
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
      setSections(prev =>
        prev.map(s => ({
          ...s,
          data: s.data.map(d =>
            d._id === deviceId
              ? { ...d, devicePerm: { can_control: newValue } }
              : d,
          ),
        })),
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.cannot_update_device_permission,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const renderSectionHeader = ({ section }) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: themeStyles.background },
      ]}
    >
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons
          name={section.type === 'unassigned' ? 'devices' : 'door'}
          size={18}
          color={themeStyles.primary}
        />
        <Text style={[styles.sectionHeaderText, { color: themeStyles.text }]}>
          {section.title}
        </Text>
      </View>
      {section.type === 'room' && section.roomPerm !== null && (
        <View style={styles.roomToggles}>
          <View style={styles.toggleGroup}>
            <Text style={[styles.toggleLabel, { color: themeStyles.subText }]}>
              {t.control}
            </Text>
            {updatingId === `room_${section.roomId}_can_control` ? (
              <ActivityIndicator size="small" color={themeStyles.primary} />
            ) : (
              <Switch
                value={section.roomPerm.can_control}
                onValueChange={() =>
                  toggleRoomPermission(
                    section.roomId,
                    'can_control',
                    section.roomPerm.can_control,
                  )
                }
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
    <View
      style={[
        styles.card,
        styles.deviceCard,
        { backgroundColor: themeStyles.card },
      ]}
    >
      <View style={styles.memberInfo}>
        <Text style={[styles.deviceName, { color: themeStyles.text }]}>
          {item.name}
        </Text>
        <Text style={{ color: themeStyles.subText, fontSize: 11 }}>
          {item.type ? item.type.toUpperCase() : 'UNKNOWN'}
          {section.type === 'room' && section.roomPerm?.can_control
            ? `  \u2022  ${t.permission_from_room}`
            : ''}
        </Text>
      </View>
      <View style={styles.toggleGroup}>
        <Text style={[styles.toggleLabel, { color: themeStyles.subText }]}>
          {t.individual}
        </Text>
        {updatingId === item._id ? (
          <ActivityIndicator size="small" color={themeStyles.primary} />
        ) : (
          <Switch
            value={item.devicePerm.can_control}
            onValueChange={() =>
              toggleDevicePermission(item._id, item.devicePerm.can_control)
            }
            trackColor={{ true: '#A5D6A7' }}
            thumbColor={item.devicePerm.can_control ? '#4CAF50' : '#ccc'}
          />
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeStyles.background }]}
      >
        <ActivityIndicator
          size="large"
          color={themeStyles.primary}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <View
        style={[styles.memberHeader, { backgroundColor: themeStyles.card }]}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: themeStyles.primary },
          ]}
        >
          <Text style={styles.avatarText}>
            {member.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View>
          <Text style={[styles.memberName, { color: themeStyles.text }]}>
            {member.name || t.default_member_name}
          </Text>
          <Text style={[styles.memberPhone, { color: themeStyles.subText }]}>
            {member.phone}
          </Text>
        </View>
      </View>

      <View style={[styles.noteBox, { backgroundColor: themeStyles.card }]}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={themeStyles.primary}
        />
        <Text style={[styles.noteText, { color: themeStyles.subText }]}>
          {t.room_permission_note}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item._id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t.no_rooms_or_devices}</Text>
        }
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  addBtn: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
  },
  deviceCard: { marginLeft: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    margin: 16,
    borderRadius: 14,
    elevation: 2,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: 'bold' },
  memberPhone: { fontSize: 13, marginTop: 2 },
  deviceName: { fontSize: 14, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionHeaderText: { fontSize: 15, fontWeight: '700' },
  roomToggles: { flexDirection: 'row', gap: 12 },
  toggleGroup: { alignItems: 'center', gap: 2 },
  toggleLabel: { fontSize: 10, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
