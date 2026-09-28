# iControlHome Mobile App

## Overview

The `iControlHome/` directory contains the `iControlHome` mobile application, built with React Native. It supports user authentication, house and room management, device control, automation, notifications, and camera activity history.

## Features

The mobile app currently provides the following main features:

- Sign in, registration, and password recovery
- House room and device management
- Device control and real-time updates
- Automation and schedule configuration
- Notifications and notification settings
- Entry and exit history and camera-based recognition

## Technologies

- `React Native 0.83.1`
- `React 19`
- `React Navigation`
- `Axios`
- `AsyncStorage`
- `Socket.IO Client`
- `Firebase Messaging`
- `Notifee`

## Configuration to Check Before Running

Review the following settings before starting the application:

- `src/database/api.js` → backend API address
- `src/database/socket.js` → real-time socket address
- `android/app/google-services.json` → Firebase configuration for Android
- `ios/.../GoogleService-Info.plist` → Firebase configuration for iOS (if applicable)

> In a local environment, the mobile app, backend, and ESP32 should be connected to the same LAN / Wi-Fi network to ensure a stable connection.

## Using Genymotion

When testing notifications on **Genymotion**, the emulator must include **Google Play Services / GApps**. Without these components, Firebase may be unable to generate an FCM token, and push notifications will not work.

## Quick Start

From the `iControlHome/` directory, run:

```bash
npm install
```

To change the backend IP address or real-time URL, update these files:

```text
src/database/api.js
src/database/socket.js
```

Then start the application:

```bash
npm start
npm run android
```

When using a physical Android device, you may need to forward the Metro port with:

```bash
adb reverse tcp:8081 tcp:8081
```

## Basic Troubleshooting

If the application does not work as expected, check the following in order:

1. All packages are installed with `npm install`.
2. The Metro bundler is running.
3. `src/database/api.js` and `src/database/socket.js` point to the correct backend and socket server.
4. The physical device or emulator is on the same network as the backend.
5. Google Play Services is available if testing notifications on Genymotion.

## Configuration Notes

With the current setup, the API and socket addresses are configured directly in:

- `src/database/api.js`
- `src/database/socket.js`

When switching local environments, update these two files accordingly.
