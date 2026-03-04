import axios from 'axios';


const BASE_URL = 'http://192.168.0.192:3001/api'; 

// 10.0.3.2 là IP "đặc quyền" của Genymotion để truy cập vào localhost của máy tính bạn
//const BASE_URL = 'http://10.0.3.2:3000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;