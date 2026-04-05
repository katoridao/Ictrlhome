# iControlHome Mobile App

This directory contains the React Native client for the HomeCtrlApp system. It is responsible for the mobile user experience, including authentication, room and device management, automation flows, notifications, and general account settings.

> This README covers the mobile application only. For full-system setup, see the root `README.md`.

## Scope

The mobile app provides the user-facing interface for:

- user login and registration
- house and room management
- device monitoring and control
- automation and scheduling flows
- profile, notification, and appearance settings

## Tech stack

- React Native `0.83.1`
- React `19`
- React Navigation
- Async Storage
- Firebase App
- Socket.IO client
- Axios

## Requirements

Before running the app locally, make sure the following are installed:

- Node.js `>= 20`
- npm
- React Native development environment
- Android Studio for Android builds
- Xcode and CocoaPods for iOS builds on macOS

## Installation

From the `iControlHome/` directory:

```bash
npm install
```

## Running the app

Start Metro:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

If you are building for iOS for the first time or after native dependency changes, install pods first:

```bash
bundle install
bundle exec pod install
```

## Available scripts

```bash
npm start      # Start Metro bundler
npm run android # Build and run on Android
npm run ios     # Build and run on iOS
npm test        # Run tests
npm run lint    # Run ESLint
```

## Project layout

```text
iControlHome/
├─ src/
│  ├─ components/     # Reusable UI components
│  ├─ context/        # Theme and language context
│  ├─ database/       # API and socket integration
│  ├─ languages/      # Localization resources
│  ├─ navigation/     # Navigation configuration
│  ├─ redux/          # State management
│  └─ screens/        # Application screens
├─ android/           # Android native project
├─ ios/               # iOS native project
└─ public/            # Static assets
```

## Development notes

- Keep API base URLs and environment-specific settings aligned with the backend service.
- Socket-related changes should be reviewed together with the backend event contracts.
- Avoid committing build output, temporary files, or local secrets.
- Use the root-level documentation for repo-wide setup and deployment context.

## Troubleshooting

If the app does not start correctly:

1. confirm that `npm install` completed without errors
2. ensure Metro is running before launching the app
3. verify that Android SDK or Xcode is configured correctly
4. clean and rebuild the native project if cached build artifacts cause issues
