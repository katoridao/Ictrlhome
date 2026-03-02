// d:\CLone Git\Ictrlhome\iControlHome\src\screens\ElectricityPriceScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

// Dữ liệu giá điện bậc thang (Nhà dân)
const TIERED_PRICES = [
  { tier: 'Bậc 1', range: '0 - 50 kWh', price: 1893 },
  { tier: 'Bậc 2', range: '51 - 100 kWh', price: 1956 },
  { tier: 'Bậc 3', range: '101 - 200 kWh', price: 2271 },
  { tier: 'Bậc 4', range: '201 - 300 kWh', price: 2834 },
  { tier: 'Bậc 5', range: '301 - 400 kWh', price: 3197 },
  { tier: 'Bậc 6', range: '> 401 kWh', price: 3302 },
];

export default function ElectricityPriceScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  const fetchCurrentPrice = async () => {
    setLoading(true);
    try {
      const houseId = await AsyncStorage.getItem('current_house_id');
      if (!houseId) return;

      // Giả sử API trả về settings mới nhất của nhà
      const response = await api.get('/electricity-settings', { params: { house_id: houseId } });
      if (response.data && response.data.price_per_kwh !== undefined) {
        setPrice(String(response.data.price_per_kwh));
      }
    } catch (error) {
      console.log('Lỗi lấy giá điện:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!price.trim() || isNaN(price)) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá điện hợp lệ (VNĐ)');
      return;
    }

    setSaving(true);
    try {
      const houseId = await AsyncStorage.getItem('current_house_id');
      if (!houseId) {
        Alert.alert('Lỗi', 'Chưa chọn nhà');
        return;
      }

      // Lưu vào bảng electricity_settings
      await api.post('/electricity-settings', {
        house_id: houseId,
        price_per_kwh: parseFloat(price),
        effective_from: new Date().toISOString().split('T')[0] // Ngày hiện tại
      });

      Alert.alert('Thành công', 'Đã cập nhật giá điện!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={{ width: 22, height: 22, tintColor: '#fff' }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài Đặt Giá Điện</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Input nhập giá điện thủ công - Khớp với price_per_kwh */}
        <Text style={[styles.label, { color: themeStyles.text }]}>Đơn giá hiện tại</Text>
        <View style={[styles.inputContainer, { borderColor: themeStyles.border, backgroundColor: themeStyles.card }]}>
          <TextInput
            style={[styles.input, { color: themeStyles.text }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={themeStyles.subText}
            keyboardType="numeric"
          />
          <Text style={[styles.unit, { color: themeStyles.subText }]}>VNĐ/kWh</Text>
        </View>
        <Text style={[styles.hint, { color: themeStyles.subText }]}>
          Giá này sẽ được áp dụng từ ngày {new Date().toLocaleDateString('vi-VN')} 
        </Text>

        {/* Bảng giá tham khảo */}
        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Bảng giá điện sinh hoạt</Text>
        <View style={[styles.card, { backgroundColor: themeStyles.card, padding: 0, overflow: 'hidden' }]}>
          <View style={[styles.tableRow, { backgroundColor: themeStyles.primary + '20', borderBottomWidth: 0 }]}>
            <Text style={[styles.tableHeader, { flex: 1.2, color: themeStyles.text }]}>Bậc</Text>
            <Text style={[styles.tableHeader, { flex: 2, color: themeStyles.text }]}>Sản lượng</Text>
            <Text style={[styles.tableHeader, { flex: 1, textAlign: 'right', color: themeStyles.text }]}>Đơn giá</Text>
          </View>
          
          {TIERED_PRICES.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.tableRow, { borderBottomColor: themeStyles.border }]}
              onPress={() => {
                setPrice(String(item.price));
                Alert.alert("Đã chọn", `Đã áp dụng giá ${item.tier}: ${item.price}đ`);
              }}
            >
              <Text style={[styles.tableText, { flex: 1.2, color: themeStyles.text, fontWeight: '600' }]}>{item.tier}</Text>
              <Text style={[styles.tableText, { flex: 2, color: themeStyles.subText }]}>{item.range}</Text>
              <Text style={[styles.tableText, { flex: 1, textAlign: 'right', color: themeStyles.primary, fontWeight: 'bold' }]}>
                {item.price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: themeStyles.primary }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu Cài Đặt</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  body: { padding: 20 },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  input: { flex: 1, fontSize: 18, fontWeight: 'bold' },
  unit: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, marginTop: 12, lineHeight: 20 },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Styles cho bảng giá
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableHeader: { fontSize: 13, fontWeight: 'bold', opacity: 0.7 },
  tableText: { fontSize: 14 },
});
