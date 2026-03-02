import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function SelectHouseScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const [myHouses, setMyHouses] = useState([]);
  const [sharedHouses, setSharedHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const phone = await AsyncStorage.getItem('phone');

      // Gọi API lấy danh sách nhà theo số điện thoại (dựa trên route GET /)
      const response = await api.get('/houses', { params: { phone } });
      const data = response.data;
      const list = data.houses || [];

      // API trả về danh sách nhà thuộc sở hữu của user
      setMyHouses(list);
      setSharedHouses([]); // API hiện tại chưa trả về nhà được chia sẻ
    } catch (error) {
      console.error('Lỗi tải danh sách nhà:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHouses();
    }, [])
  );

  const handleSelectHouse = async (house) => {
    try {
      await AsyncStorage.setItem('current_house_id', house._id);
      await AsyncStorage.setItem('current_house_name', house.name);
      Alert.alert("Đã chọn", `Đang quản lý: ${house.name}`);
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên nhà");
      return;
    }

    try {
      const phone = await AsyncStorage.getItem('phone');
      const userJson = await AsyncStorage.getItem('user_info');
      const currentUser = userJson ? JSON.parse(userJson) : {};

      await api.post('/houses', {
        name: newHouseName.trim(),
        owner_id: currentUser._id,
        phone: phone
      });

      setModalVisible(false);
      setNewHouseName('');
      fetchHouses(); // Tải lại danh sách
      Alert.alert("Thành công", "Đã thêm nhà mới");
    } catch (error) {
      console.error("Lỗi thêm nhà:", error);
      Alert.alert("Lỗi", "Không thể thêm nhà mới");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeStyles.primary}
      />
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={{ width: 22, height: 22, tintColor: '#fff' }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHỌN NHÀ</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <Text style={[styles.sectionTitle, { color: themeStyles.primary }]}>
          NHÀ CỦA BẠN
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={themeStyles.primary} style={{ marginTop: 10 }} />
        ) : myHouses.length > 0 ? (
          myHouses.map((house) => (
            <TouchableOpacity
              key={house._id}
              style={[styles.houseItem, { borderBottomColor: themeStyles.border }]}
              onPress={() => handleSelectHouse(house)}
            >
              <Text style={[styles.houseText, { color: themeStyles.text }]}>
                {house.name}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
            Bạn chưa có nhà nào. Hãy tạo mới!
          </Text>
        )}

        <Text
          style={[
            styles.sectionTitle,
            { marginTop: 24, color: themeStyles.primary },
          ]}
        >
          NHÀ ĐƯỢC CHIA SẺ
        </Text>
        
        {sharedHouses.length > 0 ? (
          sharedHouses.map((house) => (
            <TouchableOpacity
              key={house._id}
              style={[styles.houseItem, { borderBottomColor: themeStyles.border }]}
              onPress={() => handleSelectHouse(house)}
            >
              <Text style={[styles.houseText, { color: themeStyles.text }]}>
                {house.name}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
            Không có nhà nào bạn được chia sẻ
          </Text>
        )}
      </ScrollView>

      {/* Modal Thêm Nhà */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalBox, { backgroundColor: themeStyles.card }]}>
                <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Thêm Nhà Mới</Text>
                
                <TextInput 
                  placeholder="Nhập tên nhà (VD: Nhà quê)" 
                  placeholderTextColor={themeStyles.subText} 
                  style={[styles.input, { color: themeStyles.text, borderColor: themeStyles.border }]} 
                  value={newHouseName} 
                  onChangeText={setNewHouseName} 
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}>
                    <Text style={{ color: themeStyles.subText }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddHouse} style={styles.btnSave}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  addText: { color: '#fff', fontSize: 14 },
  sectionTitle: {
    marginTop: 16,
    marginLeft: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  houseItem: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  houseText: { fontSize: 15 },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 13 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  btnCancel: { padding: 10 },
  btnSave: { padding: 10 },
});
