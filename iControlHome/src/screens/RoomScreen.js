import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
export default function RoomScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Phòng</Text>
        <TouchableOpacity
          onPress={() => {
            setIsEdit(false);
            setModalVisible(true);
          }}
        >
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 22, height: 22 }}
          />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.body}>
        <RoomItem
          name="Phòng khách"
          onEdit={() => {
            setIsEdit(true);
            setModalVisible(true);
          }}
        />
        <RoomItem
          name="Phòng bếp"
          onEdit={() => {
            setIsEdit(true);
            setModalVisible(true);
          }}
        />
        <RoomItem
          name="Phòng ngủ"
          onEdit={() => {
            setIsEdit(true);
            setModalVisible(true);
          }}
        />
        <RoomItem
          name="Phòng tắm"
          onEdit={() => {
            setIsEdit(true);
            setModalVisible(true);
          }}
        />

        <Text style={styles.defaultText}>(Phòng mặc định)</Text>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionText}>Được chia sẻ</Text>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionText}>Chưa thuộc phòng</Text>
        </View>
      </ScrollView>
      {/* MODAL (UI ONLY) */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Sửa tên phòng' : 'Thêm phòng'}
            </Text>

            <TextInput placeholder="Nhập tên phòng" style={styles.input} />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#3b9cff' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#fff' }}>{isEdit ? 'Lưu' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
/* ROOM ITEM – UI ONLY */
function RoomItem({ name, onEdit }) {
  return (
    <View style={styles.roomItem}>
      <Text style={styles.roomName}>{name}</Text>

      <View style={styles.roomActions}>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/delete.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit}>
          <Image
            source={require('../../public/img/edit.png')}
            style={[styles.icon, { marginLeft: 12 }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },

  header: {
    height: 70,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sortText: { color: '#fff', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  body: {
    padding: 16,
    paddingBottom: 90,
  },

  roomItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  roomName: { fontSize: 16, color: '#000' },

  roomActions: { flexDirection: 'row' },

  icon: { width: 20, height: 20 },

  defaultText: {
    textAlign: 'center',
    color: '#555',
    marginVertical: 12,
    fontSize: 13,
  },

  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  sectionText: { fontSize: 16, color: '#000' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
});
