# iControlHome API

## Tổng quan

Thư mục `iControlHome-api/` chứa backend của hệ thống `iControlHome`. Thành phần này chịu trách nhiệm cung cấp API, xác thực người dùng, quản lý nhà / phòng / thiết bị, xử lý automation, gửi notification và phát sự kiện realtime cho ứng dụng mobile.

## Phạm vi chức năng

Backend hiện đảm nhiệm các nhóm chức năng sau:

- đăng nhập, đăng ký và cập nhật hồ sơ người dùng
- quản lý nhà, thành viên và phân quyền
- quản lý thiết bị, nhật ký hoạt động và thống kê sử dụng
- chạy automation và các worker theo lịch
- xử lý camera / nhận diện khuôn mặt
- lưu trữ notification và gửi push notification
- phát sự kiện realtime bằng `Socket.IO`

## Công nghệ sử dụng

- `Node.js`
- `Express`
- `MongoDB + Mongoose`
- `JWT`
- `Socket.IO`
- `Firebase Admin`
- `Nodemailer`

## Yêu cầu trước khi chạy

Môi trường local nên có sẵn:

- Node.js phiên bản `20+`
- npm
- MongoDB khả dụng
- file Firebase service account nếu cần kiểm thử push notification

## Cài đặt nhanh

Trong thư mục `iControlHome-api/`, thực hiện:

```bash
npm install
npm start
```

## Biến môi trường quan trọng

File `.env` thực tế không nên được commit cùng mã nguồn. Repo chỉ nên chứa file mẫu `.env.example`. Có thể tạo file local bằng lệnh:

```powershell
Copy-Item .env.example .env
```

Sau đó cập nhật các giá trị theo môi trường triển khai:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_here
FIREBASE_SERVICE_ACCOUNT_PATH=./your-firebase-adminsdk.json
```

> Các giá trị bảo mật nên được quản lý thông qua `.env` hoặc secret manager, không nên hardcode trực tiếp trong source code.

## Các nhóm route chính

Backend hiện cung cấp các nhóm route chính như sau:

- `/api` → xác thực, cấu hình chung, notification token
- `/api/houses`
- `/api/rooms`
- `/api/devices`
- `/api/device-logs`
- `/api/device-usages`
- `/api/automations`
- `/api/camera`
- `/api/notifications`

## Điều kiện để notification hoạt động

Push notification hoạt động ổn định khi đồng thời đáp ứng các điều kiện sau:

1. Firebase Admin được cấu hình chính xác trên backend
2. ứng dụng mobile đã đăng ký FCM token thành công
3. thiết bị hoặc máy ảo có Google Play Services

Khi kiểm thử trên **Genymotion**, nên bổ sung **GApps / Google Play Services** để tránh lỗi không lấy được token.

## Lưu ý trong quá trình phát triển

- khi thay đổi API, cần đối chiếu lại phía mobile
- khi thay đổi socket event, cần kiểm tra cả phía phát và phía nhận
- không commit `.env`, Firebase key hoặc credential thực tế
- nếu secret đã từng bị lộ trong git history, cần rotate ngay lập tức

Sau mỗi thay đổi quan trọng, nên kiểm tra lại cả API lẫn luồng realtime để bảo đảm backend và mobile luôn đồng bộ.
