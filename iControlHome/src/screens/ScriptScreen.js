import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
      if (!refreshing) setLoading(true);
      const res = await api.get('/automations');
      const finalData = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      setScripts(finalData);
    } catch (err) {
      console.error('Lỗi tải danh sách kịch bản:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadScripts();
    }
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScripts();
  }, []);

  const handleDelete = (id, name) => {
    Alert.alert('Xoá kịch bản', `Bạn có chắc chắn muốn xoá "${name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/automations/${id}`);
            setScripts(prev => prev.filter(item => item._id !== id));
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xoá kịch bản');
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Lọc</Text>
        <Text style={styles.headerTitle}>Tự động hoá</Text>

        {/* QUAN TRỌNG: Đã sửa tên thành 'Automation' để khớp với App.js */}
        <TouchableOpacity onPress={() => navigation.navigate('Automation')}>
          <Image
            source={require('../../public/img/add.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeStyles.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={themeStyles.primary}
            style={{ marginTop: 50 }}
          />
        ) : scripts.length > 0 ? (
          scripts.map(item => (
            <ScriptItem
              key={item._id}
              item={item}
              themeStyles={themeStyles}
              onDelete={() => handleDelete(item._id, item.name)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: '#999', fontSize: 16 }}>
              Chưa có kịch bản tự động nào
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Hàm bổ trợ hiển thị từng item kịch bản
function ScriptItem({ item, themeStyles, onDelete }) {
  const isON = item.action === 'ON';

  return (
    <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardText, { color: themeStyles.text }]}>
          {item.name}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.subLabel}>Thiết bị: </Text>
          <Text style={[styles.valText, { color: themeStyles.text }]}>
            {item.device_id?.name || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.subLabel}>Lịch trình: </Text>
          <Text style={[styles.timeHighlight, { color: themeStyles.primary }]}>
            ⏰ {item.trigger_time}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: isON ? '#E8F5E9' : '#FFEBEE' },
            ]}
          >
            <Text
              style={{
                color: isON ? '#2E7D32' : '#C62828',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {isON ? 'BẬT' : 'TẮT'}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Image
            source={require('../../public/img/user.png')}
            style={styles.userIcon}
          />
          <Text style={styles.creatorName}>
            Người tạo: {item.user_id?.name || 'Hệ thống'}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteArea}>
        <Image
          source={require('../../public/img/delete.png')}
          style={styles.deleteIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sortText: { color: '#fff' },
  headerIcon: { width: 22, height: 22, tintColor: '#fff' },
  body: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardText: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  subLabel: { color: '#888', fontSize: 13 },
  valText: { fontSize: 13, fontWeight: '600' },
  timeHighlight: { fontSize: 14, fontWeight: 'bold', marginRight: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
  },
  userIcon: { width: 14, height: 14, marginRight: 5, tintColor: '#AAA' },
  creatorName: { fontSize: 12, color: '#777', fontStyle: 'italic' },
  deleteArea: { padding: 10 },
  deleteIcon: { width: 22, height: 22, tintColor: '#FF5252' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
});
