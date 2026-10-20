
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDOeAVkOAK0FWoVZ011wCJbw2FZGVwXPkA',
  authDomain: 'nestjsreactwebsite.firebaseapp.com',
  projectId: 'nestjsreactwebsite',
  storageBucket: 'nestjsreactwebsite.firebasestorage.app',
  messagingSenderId: '854262395201',
  appId: '1:854262395201:web:ee8dcafb46f36f41ce71c0',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Task Management';
  const options = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
