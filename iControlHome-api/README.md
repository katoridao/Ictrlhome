# iControlHome API

This directory contains the backend service for HomeCtrlApp. It provides the application API, authentication flow, data persistence, automation processing, notification handling, and realtime communication used by the mobile client and connected devices.

## Responsibilities

The API is responsible for:

- user authentication and authorization
- house, room, and device management
- device logs and energy usage tracking
- automation workflows and scheduled processing
- notification delivery
- camera and face-detection endpoints
- realtime updates through Socket.IO

## Tech stack

- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Firebase Admin
- Nodemailer

## Requirements

Before running the service locally, make sure the following are available:

- Node.js `>= 20`
- npm
- a configured MongoDB connection
- environment variables required by the application

## Installation

From the `iControlHome-api/` directory:

```bash
npm install
```

## Running the server

```bash
npm start
```

The application starts the HTTP server from `./bin/www`.

## Main route groups

The backend exposes route groups for the following modules:

- `/api` for authentication and general entry endpoints
- `/api/houses`
- `/api/rooms`
- `/api/devices`
- `/api/device-logs`
- `/api/device-usages`
- `/api/automations`
- `/api/camera`
- `/api/notifications`

Most feature routes are protected by authentication middleware.

## Realtime behavior

Socket.IO is initialized at server startup and is used for house-scoped communication and runtime updates.

Notable events include:

- `join_house`
- `leave_house`
- `device-runtime`

## Project structure

```text
iControlHome-api/
├─ config/        # Database configuration
├─ middlewares/   # Auth and request middleware
├─ models/        # Mongoose models
├─ routes/        # API route handlers
├─ services/      # Automation and notification logic
├─ views/         # Server-rendered fallback views
└─ bin/           # HTTP server bootstrap
```

## Development notes

- Keep API contracts aligned with the mobile app and camera service.
- Review authentication requirements before testing protected endpoints.
- Do not commit secrets or environment-specific configuration values.
- If realtime behavior changes, verify both REST and Socket.IO consumers.
