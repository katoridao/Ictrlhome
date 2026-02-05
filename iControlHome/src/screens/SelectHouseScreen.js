import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SelectHouseScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();

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
        <TouchableOpacity>
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: themeStyles.primary }]}>
        NHÀ CỦA BẠN
      </Text>

      <TouchableOpacity
        style={[styles.houseItem, { borderBottomColor: themeStyles.border }]}
      >
        <Text style={[styles.houseText, { color: themeStyles.text }]}>
          Nhà chính
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.houseItem, { borderBottomColor: themeStyles.border }]}
      >
        <Text style={[styles.houseText, { color: themeStyles.text }]}>
          Nhà phụ
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.sectionTitle,
          { marginTop: 24, color: themeStyles.primary },
        ]}
      >
        NHÀ ĐƯỢC CHIA SẺ
      </Text>
      <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
        Không có nhà nào bạn được chia sẻ
      </Text>
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
});
