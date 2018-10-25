/*jshint esversion: 6 */
/*globals caches, Promise, importScripts, firebase, self */

var VERSION = '30';

importScripts('/__/firebase/5.0.0/firebase-app.js');
importScripts('/__/firebase/5.0.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');
var messaging = firebase.messaging();

this.addEventListener('install', function(e) {
  e.waitUntil(caches.open(VERSION).then(cache => {
    return cache.addAll([
      '/',
      '/manifest.webmanifest',
      '/add/',
      '/requests/',
      '/requests/add/',
      '/notify/',
      '/css/default.css',
      '/css/materialize.min.css',
      '/js/add.js',
      '/js/donors.js',
      '/js/init.js',
      '/js/materialize.min.js',
      '/js/notify.js',
      '/js/requests.js',
      '/js/requestsadd.js',
      '/add/atolls.min.json',
      '/add/islands.min.json'
    ]);
  }));
});

this.addEventListener('fetch', function(e) {
  var tryInCachesFirst = caches.open(VERSION).then(cache => {
    return cache.match(e.request).then(response => {
      if (!response) {
        return handleNoCacheMatch(e);
      }
      // Update cache record in the background
      fetchFromNetworkAndCache(e);
      // Reply with stale data
      return response;
    });
  });
  e.respondWith(tryInCachesFirst);
});

this.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(keys => {
    return Promise.all(keys.map(key => {
      if (key !== VERSION)
        return caches.delete(key);
    }));
  }));
});

function fetchFromNetworkAndCache(e) {
  // DevTools opening will trigger these o-i-c requests, which this SW can't handle.
  // There's probaly more going on here, but I'd rather just ignore this problem. :)
  // https://github.com/paulirish/caltrainschedule.io/issues/49
  if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;

  return fetch(e.request).then(res => {
    // foreign requests may be res.type === 'opaque' and missing a url
    if (!res.url) return res;
    // regardless, we don't want to cache other origin's assets
    if (new URL(res.url).origin !== location.origin) return res;

    return caches.open(VERSION).then(cache => {
      // TODO: figure out if the content is new and therefore the page needs a reload.
      cache.put(e.request, res.clone());
      return res;
    });
  }).catch(err => console.error(e.request.url, err));
}

function handleNoCacheMatch(e) {
  return fetchFromNetworkAndCache(e);
}


messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  var notificationTitle = 'Background Message Title';
  var notificationOptions = {
    body: 'Background Message body.',
    icon: '/favicon.png',
    badge: '/icons/badge.png',
    click_action: '/request/'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
