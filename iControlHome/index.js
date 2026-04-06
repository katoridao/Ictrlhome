/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { handleRemoteMessageNotification } from './src/services/notificationService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await handleRemoteMessageNotification(remoteMessage, {
    isBackground: true,
  });
});

AppRegistry.registerComponent(appName, () => App);
