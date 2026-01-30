import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function SelectHouseScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={{ width: 22, height: 22 }}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CHỌN NHÀ</Text>

        <TouchableOpacity>
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* NHÀ CỦA BẠN */}
      <Text style={styles.sectionTitle}>NHÀ CỦA BẠN</Text>

      <TouchableOpacity style={styles.houseItem}>
        <Text style={styles.houseText}>Nhà riêng</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.houseItem}>
        <Text style={styles.houseText}>Nhà phụ</Text>
      </TouchableOpacity>

      {/* NHÀ ĐƯỢC CHIA SẺ */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        NHÀ ĐƯỢC CHIA SẺ
      </Text>

      <Text style={styles.emptyText}>Không có nhà nào bạn được chia sẻ</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    height: 70,
    backgroundColor: '#3b9cff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addText: {
    color: '#fff',
    fontSize: 14,
  },

  /* SECTION */
  sectionTitle: {
    marginTop: 16,
    marginLeft: 16,
    color: '#3b9cff',
    fontSize: 13,
    fontWeight: '600',
  },

  /* HOUSE ITEM */
  houseItem: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  houseText: {
    fontSize: 15,
    color: '#000',
  },

  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
  },
});
