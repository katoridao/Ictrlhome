import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, StatusBar, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext'; 
import api from '../database/api'; 

export default function ScriptScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();
  const [scripts, setScripts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused(); 

  const loadScripts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/automations');
      const finalData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setScripts(finalData);
    } catch (err) {
      console.error("Lỗi tải kịch bản:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

 const handleDelete = (id, name) => {
  Alert.alert(
    "Xác nhận xoá",
    `Bạn có chắc muốn xoá kịch bản "${name}" không?`,
    [
      { text: "Huỷ", style: "cancel" },
      { 
        text: "Xoá", 
        style: "destructive", 
        onPress: async () => {
          try {
            // BASE_URL của bạn là .../api nên ở đây gọi trực tiếp /automations/id
            const res = await api.delete(`/automations/${id}`);
            
            if (res.status === 200 || res.data.success) {
              setScripts(prev => prev.filter(item => item._id !== id));
              console.log("Xoá thành công trên giao diện");
            }
          } catch (err) {
            // Xem log ở đây sẽ thấy lỗi thật (ví dụ 401 là do Token, 404 là sai URL)
            console.log("LỖI CHI TIẾT:", err.response?.status, err.response?.data);
            Alert.alert("Lỗi", "Không thể xoá. Hãy xem log ở VS Code!");
          }
        } 
      }
    ]
  );
};
  useEffect(() => {
    if (isFocused) loadScripts();
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScripts();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'} backgroundColor={themeStyles.primary} />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Kịch bản</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Automation')}>
          <Image source={require('../../public/img/add.png')} style={{ width: 22, height: 22, tintColor: '#fff' }} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeStyles.primary} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 50 }} />
        ) : scripts.length > 0 ? (
          scripts.map((item) => (
            <ScriptItem
              key={item._id}
              title={item.name || "Kịch bản"}
              deviceName={item.action?.device_id?.name || "Thiết bị..."}
              time={item.time || "00:00"}
              status={item.action?.status}
              themeStyles={themeStyles}
              onDelete={() => handleDelete(item._id, item.name)} // Truyền hàm xoá xuống
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: '#999', fontSize: 16 }}>Chưa có kịch bản nào.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Phần render trong ScriptScreen.js (Dùng bản Full tôi gửi trước đó, chỉ cần sửa ScriptItem)
function ScriptItem({ title, deviceName, time, status, themeStyles, onDelete }) {
  return (
    <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardText, { color: themeStyles.text }]}>{title}</Text>
        <Text style={{ color: '#666' }}>Thiết bị: {deviceName}</Text>
        
        {/* Hiển thị Bật/Tắt rõ ràng */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
            <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: status ? '#4CAF50' : '#F44336', marginRight: 5}} />
            <Text style={{ color: status ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                {time} — {status ? 'BẬT' : 'TẮT'}
            </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} style={{padding: 10}}>
         <Text style={{color: '#FF4444', fontWeight: 'bold'}}>Xoá</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 90, paddingTop: 30, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortText: { color: '#fff' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  body: { padding: 16 },
  card: {
    borderRadius: 15, padding: 15, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1,
  },
  cardText: { fontSize: 17, fontWeight: 'bold' },
  deleteBtn: { padding: 10, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 }
});