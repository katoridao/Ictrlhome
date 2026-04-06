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
