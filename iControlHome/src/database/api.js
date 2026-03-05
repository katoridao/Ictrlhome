import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';



const BASE_URL = 'http://10.0.3.2:3000/api'; 

// 10.0.3.2 là IP "đặc quyền" của Genymotion để truy cập vào localhost của máy tính bạn
//const BASE_URL = 'http://10.0.3.2:3000/api'; 

//const BASE_URL = 'http://192.168.1.110:3000/api';


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm token vào mỗi request
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Xử lý lỗi response toàn cục
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      // Có thể navigate về màn hình Login ở đây nếu cần
      console.warn('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
    }
    return Promise.reject(error);
  },
);

export default api;
