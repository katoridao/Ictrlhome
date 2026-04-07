# iControlHome API

This folder contains the backend service for the smart-home system. It powers authentication, house / room / device APIs, automation workers, camera endpoints, realtime socket events, and notification delivery.

## Responsibilities

The backend is responsible for:

- login / register / profile flows
- house, room, member, and permission management
- device control, logs, and usage tracking
- automation scheduling and worker execution
- camera / face-detection endpoints
- storing and sending notifications
- Socket.IO realtime updates to the mobile app

## Tech stack

- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT authentication
- Firebase Admin (push notification support)
- Nodemailer

## Prerequisites

Before running locally, make sure you have:

- Node.js `>= 20`
- npm
- a reachable MongoDB database
- Firebase service account JSON if you want push notifications

## Install dependencies

From the `iControlHome-api/` directory:

```bash
npm install
```

## Environment / local config

When someone else pulls this repo, the real `.env` will **not** be included (it is ignored on purpose). Use the committed template instead:

### Quick setup

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Then update the values in `.env` for the local machine.

At minimum, check these values before starting:

- `config/database.js` → MongoDB connection string
- `.env` → local secrets such as Firebase service account path

Current local setup usually needs something like:

```env
MONGO_URL=mongodb+srv://your_user:your_password@cluster.mongodb.net/iControlHome
FIREBASE_SERVICE_ACCOUNT_PATH=./your-firebase-adminsdk.json
JWT_SECRET=your_secret_here
```

> Recommended practice: keep secrets in `.env` and **do not hardcode** production credentials in source files.

## Run the server

```bash
npm start
```

The server is started from `./bin/www`.

## Main route groups

The backend exposes route groups such as:

- `/api` → auth and general endpoints
- `/api/houses`
- `/api/rooms`
- `/api/devices`
- `/api/device-logs`
- `/api/device-usages`
- `/api/automations`
- `/api/camera`
- `/api/notifications`

Most feature routes require authentication middleware.

## Realtime behavior

Socket.IO is initialized when the server starts and is used for house-scoped events, for example:

- `join_house`
- `leave_house`
- `device_status_changed`
- `member_added`
- `permission_updated`
- `device-runtime`

## Project structure

```text
iControlHome-api/
├─ config/        # Database config
├─ middlewares/   # Auth and permission checks
├─ models/        # Mongoose models
├─ routes/        # API route handlers
├─ services/      # Automation + notification logic
├─ views/         # Fallback server-rendered pages
└─ bin/           # HTTP bootstrap
```

## Notification note

Push notifications only work when:

1. Firebase Admin credentials are configured correctly here
2. the mobile app has successfully registered an FCM token
3. the Android emulator / device supports Google Play Services

If someone tests on **Genymotion**, they should install **GApps / Google Play Services** on the emulator; otherwise FCM token generation will fail.

## Development notes

- Keep backend contracts aligned with the mobile app and camera service
- Verify both REST and Socket.IO consumers when changing realtime behavior
- Do not commit `.env`, Firebase keys, database credentials, or signing files
- Rotate credentials immediately if they are ever exposed in git history

---

# README tiếng Việt

## Thư mục này dùng để làm gì?

Đây là phần backend của hệ thống `iControlHome`. Nó chịu trách nhiệm xử lý API, xác thực người dùng, quản lý nhà / phòng / thiết bị, automation, notification và realtime socket cho app mobile.

## Backend hiện đang lo những phần nào?

Cụ thể hơn thì bên này đang xử lý:

- đăng nhập, đăng ký, cập nhật profile
- quản lý nhà, thành viên và phân quyền
- quản lý thiết bị, lịch sử bật tắt và thống kê sử dụng
- automation và worker chạy theo giờ
- camera / nhận diện khuôn mặt
- lưu notification và gửi push notification
- realtime bằng `Socket.IO`

## Công nghệ chính

- `Node.js`
- `Express`
- `MongoDB + Mongoose`
- `JWT`
- `Socket.IO`
- `Firebase Admin`
- `Nodemailer`

## Trước khi chạy cần chuẩn bị gì?

Ít nhất cần có:

- Node.js từ bản `20+`
- npm
- một MongoDB đang chạy được
- file Firebase service account nếu muốn test push notification

## Cài đặt nhanh

Trong thư mục `iControlHome-api/`:

```bash
npm install
npm start
```

## Biến môi trường quan trọng

Khi người khác `pull` về thì file `.env` thật sẽ **không đi kèm**. Repo chỉ nên commit `.env.example`, rồi copy ra `.env` bằng lệnh sau:

```powershell
Copy-Item .env.example .env
```

Sau đó sửa giá trị trong `.env` theo máy local.

Hiện tại cậu nên chú ý mấy biến sau trong `.env`:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_here
FIREBASE_SERVICE_ACCOUNT_PATH=./your-firebase-adminsdk.json
```

> Nói ngắn gọn: secret thì cứ để trong `.env`, đừng hardcode thẳng vào source cho an toàn.

## Các route chính

Backend hiện có các nhóm route như:

- `/api` → auth, settings, notification token...
- `/api/houses`
- `/api/rooms`
- `/api/devices`
- `/api/device-logs`
- `/api/device-usages`
- `/api/automations`
- `/api/camera`
- `/api/notifications`

## Notification hoạt động khi nào?

Push notification chỉ hoạt động ổn khi đủ mấy điều kiện này:

1. Firebase Admin đã cấu hình đúng
2. app mobile đã lấy được FCM token
3. thiết bị / máy ảo có Google Play Services

Nếu ai test bằng **Genymotion** thì nên cài thêm **GApps** luôn, không thì rất dễ gặp lỗi không lấy được token.

## Lưu ý khi dev

- đổi API thì nhớ so lại bên mobile
- đổi socket event thì kiểm tra cả 2 phía
- đừng commit `.env`, key Firebase hoặc credential thật
- nếu đã lỡ lộ secret lên git thì nên rotate ngay

Nói chung, đây là “bộ não” của hệ thống, nên mỗi khi sửa gì ở backend thì nhớ test cả API lẫn luồng realtime để tránh lệch với app.
