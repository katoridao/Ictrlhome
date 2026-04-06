# iControlHome Mobile App

This folder contains the React Native mobile client for the smart-home system. It is the app used for login, house management, device control, automation, camera history, notifications, and personal settings.

## Main responsibilities

The mobile app handles:

- authentication and account flows
- room and device management
- device control and realtime updates
- automation scheduling
- notification settings and in-app alerts
- people / camera history screens

## Tech stack

- React Native `0.83.1`
- React `19`
- React Navigation
- Async Storage
- Axios
- Socket.IO client
- Firebase App + Firebase Messaging
- Notifee for local notification rendering

## Prerequisites

Before running the app locally, install:

- Node.js `>= 20`
- npm
- JDK `17` or compatible Android toolchain
- Android Studio + Android SDK
- ADB
- Xcode + CocoaPods (only if building on iOS/macOS)

## Important configuration before running

Check these files and update them for your local network / environment:

- `src/database/api.js` → `BASE_URL`
- `src/database/socket.js` → `SOCKET_URL`
- `android/app/google-services.json` → Android Firebase config
- `ios/.../GoogleService-Info.plist` → iOS Firebase config (if using iOS)

> The mobile app, backend API, and ESP32/camera service should usually be on the **same LAN** during local development.

## Genymotion note (important for notifications)

If you use **Genymotion**, you should install **GApps / Google Play Services**.

Without GApps, Firebase Messaging cannot generate an FCM token and push notifications will fail with errors similar to:

```text
MISSING_INSTANCEID_SERVICE
```

Recommended options:

- use a Genymotion image that already includes Google apps, or
- manually install the matching **Open GApps** package for that Android version / architecture

## Installation

From the `iControlHome/` directory:

```bash
npm install
```

If you use a physical Android device, you may also need:

```bash
adb reverse tcp:8081 tcp:8081
```

## Run the app

Start Metro first:

```bash
npm start
```

Then run Android:

```bash
npm run android
```

Or run iOS:

```bash
npm run ios
```

For iOS after native dependency changes:

```bash
bundle install
bundle exec pod install
```

## Available scripts

```bash
npm start       # Start Metro bundler
npm run android # Build and run Android app
npm run ios     # Build and run iOS app
npm test        # Run Jest tests
npm run lint    # Run ESLint
```

## Folder layout

```text
iControlHome/
├─ src/
│  ├─ components/     # Reusable UI
│  ├─ context/        # Theme + language context
│  ├─ database/       # API and socket setup
│  ├─ languages/      # Localization strings
│  ├─ navigation/     # App navigation
│  ├─ redux/          # State (if used)
│  └─ screens/        # App screens
├─ android/           # Native Android project
├─ ios/               # Native iOS project
└─ public/            # Static assets / images / sounds
```

## Troubleshooting

If the app does not start correctly:

1. run `npm install` again to make sure dependencies are present
2. make sure Metro is running before launching the app
3. confirm `BASE_URL` and `SOCKET_URL` point to a reachable backend
4. if the device cannot connect to Metro, use `adb reverse tcp:8081 tcp:8081`
5. if notifications do not work on Genymotion, install **GApps / Google Play Services** first

## Security note

Do not commit local secrets, Firebase credentials, or environment-specific files. The repository already ignores the main secret file patterns, but keep checking before each commit.

---

# README tiếng Việt

## Thư mục này là gì?

Đây là phần app mobile của dự án `iControlHome`, được viết bằng React Native. Nói ngắn gọn thì đây là ứng dụng mà người dùng cầm trên điện thoại để đăng nhập, quản lý nhà, điều khiển thiết bị, tạo automation, xem lịch sử camera và chỉnh các cài đặt cá nhân.

## App này đang phụ trách những gì?

Phần mobile hiện xử lý các nhóm chức năng chính như:

- đăng nhập, đăng ký, quên mật khẩu
- quản lý phòng, thiết bị trong nhà
- bật / tắt thiết bị và nhận cập nhật realtime
- tạo automation / hẹn giờ
- nhận notification và chỉnh cài đặt thông báo
- xem lịch sử người ra vào / nhận diện từ camera

## Công nghệ chính đang dùng

- `React Native 0.83.1`
- `React 19`
- `React Navigation`
- `Axios`
- `AsyncStorage`
- `Socket.IO client`
- `Firebase Messaging`
- `Notifee`

## Trước khi chạy app cần kiểm tra gì?

Cậu nên xem trước mấy chỗ này:

- `src/database/api.js` → địa chỉ API backend
- `src/database/socket.js` → địa chỉ socket realtime
- `android/app/google-services.json` → cấu hình Firebase cho Android
- `ios/.../GoogleService-Info.plist` → cấu hình Firebase cho iOS (nếu dùng)

> Khi chạy local, mobile app, backend và ESP32 nên ở cùng mạng LAN để dễ kết nối hơn.

## Nếu dùng Genymotion thì lưu ý gì?

Nếu test notification bằng **Genymotion** thì nhớ cài **GApps / Google Play Services**. Không có phần này thì Firebase thường không lấy được FCM token, lúc đó notification push sẽ không tới được máy giả lập.

## Cách cài và chạy nhanh

Trong thư mục `iControlHome/`:

```bash
npm install
npm start
npm run android
```

Nếu dùng máy Android thật thì đôi khi cần thêm:

```bash
adb reverse tcp:8081 tcp:8081
```

## Nếu app chạy lỗi thì nên kiểm tra theo thứ tự này

1. `npm install` đã cài đủ package chưa
2. Metro đã chạy chưa
3. `BASE_URL` và `SOCKET_URL` đã đúng IP backend chưa
4. máy thật / emulator có cùng mạng với backend không
5. nếu notification không chạy trên Genymotion thì kiểm tra lại Google Play Services

## Ghi chú nhỏ về bảo mật

Mấy file như `.env`, Firebase key, file ký app hay config local thì không nên commit lên git. Repo đã có `.gitignore` cho phần lớn các file nhạy cảm rồi, nhưng trước khi push vẫn nên liếc lại `git status` một lần cho chắc.
