# iControlHome API

## Overview

The `iControlHome-api/` directory contains the backend for the `iControlHome` system. It provides the API, handles user authentication, manages houses, rooms, and devices, processes automations, sends notifications, and emits real-time events to the mobile app.

## Features

The backend currently provides the following main features:

- User sign-in, registration, and profile updates
- House, member, and access-permission management
- Device management, activity logs, and usage statistics
- Automation execution and scheduled workers
- Camera and facial recognition processing
- Notification storage and push notification delivery
- Real-time event delivery using `Socket.IO`

## Technologies

- `Node.js`
- `Express`
- `MongoDB + Mongoose`
- `JWT`
- `Socket.IO`
- `Firebase Admin`
- `Nodemailer`

## Requirements

The local environment should have the following:

- Node.js version `20+`
- npm
- An accessible MongoDB instance
- A Firebase service account file if testing push notifications

## Quick Start

From the `iControlHome-api/` directory, run:

```bash
npm install
npm start
```

## Important Environment Variables

The actual `.env` file should not be committed with the source code. The repository should contain only the `.env.example` template. Create a local `.env` file with:

```powershell
Copy-Item .env.example .env
```

Then update the values for your deployment environment:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_here
FIREBASE_SERVICE_ACCOUNT_PATH=./your-firebase-adminsdk.json
```

> Manage sensitive values through `.env` or a secret manager. Do not hardcode them in the source code.

## Main Route Groups

The backend currently provides the following route groups:

- `/api` → authentication, general configuration, and notification tokens
- `/api/houses`
- `/api/rooms`
- `/api/devices`
- `/api/device-logs`
- `/api/device-usages`
- `/api/automations`
- `/api/camera`
- `/api/notifications`

## Push Notification Requirements

Push notifications work reliably when all of the following conditions are met:

1. Firebase Admin is configured correctly on the backend.
2. The mobile app has successfully registered an FCM token.
3. The device or emulator has Google Play Services.

When testing on **Genymotion**, install **GApps / Google Play Services** to avoid issues generating a token.

## Development Notes

- When changing the API, verify the corresponding mobile app implementation.
- When changing a socket event, check both the sender and receiver.
- Do not commit `.env`, Firebase keys, or actual credentials.
- If a secret has ever been exposed in Git history, rotate it immediately.

After every significant change, test both the API and real-time flows to ensure the backend and mobile app remain in sync.
