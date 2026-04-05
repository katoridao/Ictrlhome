import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';

export default function PeopleScreen() {
  const { styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPeople = useCallback(async () => {
    try {
      const houseId =
        (await AsyncStorage.getItem('current_house_id')) || 'H001';
      const response = await api.get('/camera/faces', {
        params: { house_id: houseId },
      });
      setPeople(response.data.faces || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.unable_load_faces,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchPeople();
    }, [fetchPeople]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPeople();
    setRefreshing(false);
  }, [fetchPeople]);

  const handleDelete = person => {
    Alert.alert(
      t.delete_face_title,
      t.delete_face_confirm.replace('{name}', person.name),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/camera/faces/${person._id}`);
              setPeople(prev => prev.filter(p => p._id !== person._id));
              Toast.show({
                type: 'success',
                text1: t.success,
                text2: t.deleted_face_message.replace('{name}', person.name),
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: t.error,
                text2: error.response?.data?.message || t.unable_delete_face,
              });
            }
          },
        },
      ],
    );
  };

  const renderPerson = ({ item }) => {
    const imageUri = item.image ? `data:image/jpeg;base64,${item.image}` : null;

    return (
      <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: themeStyles.primary },
            ]}
          >
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.personInfo}>
          <Text style={[styles.personName, { color: themeStyles.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.personMeta, { color: themeStyles.subText }]}>
            {t.registered_on}: {formatDate(item.createdAt, t.unknown_time)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
        >
          <MaterialCommunityIcons
            name="account-remove"
            size={22}
            color="#F44336"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <MaterialCommunityIcons
          name="face-recognition"
          size={24}
          color="#fff"
        />
        <Text style={styles.headerTitle}>{t.household_people}</Text>
      </View>

      {/* INFO BOX */}
      <View style={[styles.infoBox, { backgroundColor: themeStyles.card }]}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={themeStyles.primary}
        />
        <Text style={[styles.infoText, { color: themeStyles.subText }]}>
          {t.people_info}
        </Text>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={themeStyles.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={people}
          keyExtractor={item => item._id}
          renderItem={renderPerson}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeStyles.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={80}
                color="#ccc"
              />
              <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
                {t.no_registered_faces}
              </Text>
              <Text style={[styles.emptyHint, { color: themeStyles.subText }]}>
                {t.use_camera_add_people}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(date, fallback = '--') {
  if (!date) return fallback;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  personInfo: { flex: 1, marginLeft: 14 },
  personName: { fontSize: 16, fontWeight: 'bold' },
  personMeta: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: { fontSize: 16, marginTop: 16 },
  emptyHint: { fontSize: 13, marginTop: 6, opacity: 0.7 },
});
