import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RoomScreen() {
  const { styles: themeStyles } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Phòng</Text>
        <TouchableOpacity onPress={() => { setIsEdit(false); setModalVisible(true); }}>
          <Image source={require('../../public/img/add.png')} style={{ width: 22, height: 22, tintColor: '#fff' }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <RoomItem name="Phòng khách" themeStyles={themeStyles} onEdit={() => { setIsEdit(true); setModalVisible(true); }} />
        <RoomItem name="Phòng bếp" themeStyles={themeStyles} onEdit={() => { setIsEdit(true); setModalVisible(true); }} />
          <RoomItem name="Phòng ngủ" themeStyles={themeStyles} onEdit={() => { setIsEdit(true); setModalVisible(true); }} />
        
        <Text style={[styles.defaultText, { color: themeStyles.subText }]}>(Phòng mặc định)</Text>

        <View style={[styles.sectionBox, { backgroundColor: themeStyles.card }]}>
          <Text style={[styles.sectionText, { color: themeStyles.text }]}>Được chia sẻ</Text>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeStyles.card }]}>
            <Text style={[styles.modalTitle, { color: themeStyles.text }]}>{isEdit ? 'Sửa tên phòng' : 'Thêm phòng'}</Text>
            <TextInput 
              placeholder="Nhập tên phòng" 
              placeholderTextColor={themeStyles.subText}
              style={[styles.input, { color: themeStyles.text, borderColor: themeStyles.border }]} 
            />
            {/* ... Modal Actions ... */}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoomItem({ name, onEdit, themeStyles }) {
  return (
    <View style={[styles.roomItem, { backgroundColor: themeStyles.card }]}>
      <Text style={[styles.roomName, { color: themeStyles.text }]}>{name}</Text>
      <View style={styles.roomActions}>
        <TouchableOpacity><Image source={require('../../public/img/delete.png')} style={[styles.icon, { tintColor: '#f52109' }]} /></TouchableOpacity>
        <TouchableOpacity onPress={onEdit}><Image source={require('../../public/img/edit.png')} style={[styles.icon, { marginLeft: 12, tintColor: '#f52109' }]} /></TouchableOpacity>
      </View>
    </View>
  );
}
// Giữ nguyên styles cũ nhưng bỏ màu background/text cố định
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 70, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  sortText: { color: '#fff' },
  body: { padding: 16 },
  roomItem: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  roomName: { fontSize: 16 },
  roomActions: { flexDirection: 'row' },
  icon: { width: 20, height: 20 },
  defaultText: { textAlign: 'center', marginVertical: 12, fontSize: 13 },
  sectionBox: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 16 },
});