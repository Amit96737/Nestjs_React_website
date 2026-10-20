
import { getToken } from 'firebase/messaging';
import {
  firebaseVapidKey,
  getFirebaseMessaging,
} from '../firebase';

export async function enablePushNotifications(): Promise<string> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.');
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    throw new Error('Firebase Messaging is not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
  );

  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error('Could not generate an FCM token.');
  }

  return token;
}
