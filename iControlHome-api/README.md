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
