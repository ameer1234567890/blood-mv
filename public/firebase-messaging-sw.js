/*globals 	importScripts, firebase, self */

// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
importScripts('/__/firebase/5.0.0/firebase-app.js');
importScripts('/__/firebase/5.0.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

var messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  var notificationTitle = 'Background Message Title';
  var notificationOptions = {
    body: 'Background Message body.',
    icon: '/favicon.png',
    badge: '/icons/badge.png',
    click_action: '/request/'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
// [END background_handler]
