# iControlHome Mobile App

## Tổng quan

Thư mục `iControlHome/` chứa ứng dụng mobile của hệ thống `iControlHome`, được phát triển bằng React Native. Ứng dụng này phục vụ các tác vụ như xác thực người dùng, quản lý nhà và phòng, điều khiển thiết bị, xử lý automation, nhận thông báo và hiển thị lịch sử camera.

## Phạm vi chức năng

Ứng dụng mobile hiện đảm nhiệm các nhóm chức năng chính sau:

- đăng nhập, đăng ký và quên mật khẩu
- quản lý phòng và thiết bị trong nhà
- điều khiển thiết bị và nhận cập nhật realtime
- thiết lập automation / lịch chạy
- nhận thông báo và cấu hình notification
- theo dõi lịch sử người ra vào / nhận diện camera

## Công nghệ sử dụng

- `React Native 0.83.1`
- `React 19`
- `React Navigation`
- `Axios`
- `AsyncStorage`
- `Socket.IO Client`
- `Firebase Messaging`
- `Notifee`

## Cấu hình cần kiểm tra trước khi chạy

Các cấu hình quan trọng cần được rà soát trước khi khởi động ứng dụng:

- `src/database/api.js` → địa chỉ API backend
- `src/database/socket.js` → địa chỉ socket realtime
- `android/app/google-services.json` → cấu hình Firebase cho Android
- `ios/.../GoogleService-Info.plist` → cấu hình Firebase cho iOS (nếu áp dụng)

> Trong môi trường local, mobile app, backend và ESP32 nên nằm trên cùng một mạng LAN / Wi‑Fi để bảo đảm khả năng kết nối ổn định.

## Lưu ý khi sử dụng Genymotion

Nếu kiểm thử notification trên **Genymotion**, môi trường giả lập cần có **Google Play Services / GApps**. Nếu thiếu thành phần này, Firebase có thể không tạo được FCM token và push notification sẽ không hoạt động.

## Cài đặt và chạy nhanh

Trong thư mục `iControlHome/`, thực hiện:

```bash
npm install
```

Nếu cần thay đổi IP backend hoặc URL realtime, cập nhật trực tiếp tại:

```text
src/database/api.js
src/database/socket.js
```

Sau đó khởi động ứng dụng:

```bash
npm start
npm run android
```

Khi sử dụng thiết bị Android thật, có thể cần thêm lệnh sau để chuyển tiếp cổng Metro:

```bash
adb reverse tcp:8081 tcp:8081
```

## Hướng dẫn kiểm tra sự cố cơ bản

Nếu ứng dụng không hoạt động đúng như mong đợi, nên kiểm tra theo thứ tự sau:

1. các package đã được cài đầy đủ bằng `npm install`
2. Metro bundler đã được khởi động
3. `src/database/api.js` và `src/database/socket.js` đã trỏ đúng tới backend và socket server
4. thiết bị thật / máy ảo có cùng mạng với backend
5. Google Play Services đã sẵn sàng nếu kiểm thử notification trên Genymotion

## Ghi chú cấu hình

Với cấu trúc hiện tại, địa chỉ API và socket được chỉnh trực tiếp trong:

- `src/database/api.js`
- `src/database/socket.js`

Khi đổi môi trường chạy local, chỉ cần cập nhật hai file này cho phù hợp.
