import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';

export default function EditProfileScreen({ navigation }) {
  const [role, setRole] = useState('Chủ nhà');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b9cff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa thông tin</Text>
        <TouchableOpacity>
          <Text style={styles.saveText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* AVATAR */}
        <View style={styles.avatarBox}>
          <Image
            source={require('../../public/img/avatar.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Đổi ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.formBox}>
          <InputItem label="Họ và tên" placeholder="Nhập họ và tên" />
          <InputItem label="Email" placeholder="Nhập email" />
          <InputItem label="Số điện thoại" placeholder="Nhập số điện thoại" />

          {/* ROLE */}
          <Text style={styles.label}>Vai trò</Text>
          <View style={styles.roleRow}>
            <RoleItem
              label="Chủ nhà"
              active={role === 'Chủ nhà'}
              onPress={() => setRole('Chủ nhà')}
            />
            <RoleItem
              label="Người nhà"
              active={role === 'Người nhà'}
              onPress={() => setRole('Người nhà')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* INPUT ITEM */
function InputItem({ label, placeholder }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>
  );
}

/* ROLE ITEM */
function RoleItem({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.roleItem, active && styles.roleActive]}
      onPress={onPress}
    >
      <Text style={[styles.roleText, active && { color: '#fff' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },

  header: {
    height: 80,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backIcon: { width: 22, height: 22, tintColor: '#fff' },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  body: {
    padding: 16,
    paddingBottom: 40,
  },

  avatarBox: {
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
  },

  changeAvatarBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
  },

  changeAvatarText: {
    color: '#3b9cff',
    fontSize: 14,
    fontWeight: '600',
  },

  formBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
  },

  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  roleItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b9cff',
    alignItems: 'center',
    marginHorizontal: 6,
  },

  roleActive: {
    backgroundColor: '#3b9cff',
  },

  roleText: {
    fontSize: 15,
    color: '#3b9cff',
    fontWeight: '600',
  },
});
