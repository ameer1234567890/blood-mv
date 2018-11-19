/*jshint esversion: 6 */
/*globals caches, Promise, importScripts, firebase, self */

var VERSION = '36';

importScripts('/__/firebase/5.5.7/firebase-app.js');
importScripts('/__/firebase/5.5.7/firebase-messaging.js');
importScripts('/__/firebase/init.js');
var messaging = firebase.messaging();

this.addEventListener('install', function(e) {
  self.skipWaiting();
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
      '/js/jquery.min.js',
      '/js/add.js',
      '/js/donors.js',
      '/js/init.js',
      '/js/materialize.min.js',
      '/js/notify.js',
      '/js/requests.js',
      '/js/requestsadd.js',
      '/add/atolls.min.json',
      '/add/islands.min.json',
      '/favicon.png'
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
      if(e.request.method == 'GET') {
        cache.put(e.request, res.clone());
      }
      return res;
    });
  }).catch(err => console.error(e.request.url, err));
}

function handleNoCacheMatch(e) {
  return fetchFromNetworkAndCache(e);
}


messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[SW] Received background message ', payload);
  return self.registration.showNotification(payload.data.title, {
    body: payload.data.body,
    icon: payload.data.icon,
    badge: payload.data.badge,
    click_action: payload.data.click_action
  });
});


importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');
workbox.googleAnalytics.initialize({
  parameterOverrides: {
    dimension1: 'offline',
  },
  hitFilter: (params) => {
    const queueTimeInSeconds = Math.round(params.get('qt') / 1000);
    params.set('metric1', queueTimeInSeconds);
  },
});
