/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, firebase, ga, M, navigator,  */
/* exported tableSearch, getKeyValueStore, setKeyValueStore, age, humanDate, htmlDate, topLoader,
   matIconCheckBox, matIconCheckBoxOutline, matIconExpandMore, matIconMoreHoriz, matIconRefresh,
   matIconDelete, matIconCheck, matIconClear, matIconShare */

// Create firebase database reference
var db = firebase.firestore();
db.settings({timestampsInSnapshots: true});

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

// Add the public key generated from the console here.
messaging.usePublicVapidKey('BL1aLfJpeXegbscdgQ5s0Zs95fo9EDXvgCnbGShysqEBbX60hoYPuUuY0zLH_IAsVp38mNqzBYetW3QtUb-24h0');

// Initialize Google Auth Provider
var provider = new firebase.auth.GoogleAuthProvider();

// Enable offline database caching
firebase.firestore().enablePersistence({experimentalTabSynchronization:true}).catch(function(err) { console.error(err); });

// Initialize sidenav & dropdown
$('.sidenav').sidenav();
var sidenavInstance = document.querySelectorAll('.sidenav')[0].M_Sidenav;
$('.dropdown-trigger').dropdown();

// Some global variables
var topLoader = 'body > .progress';
var authStatusUpdated = false;
var isAdmin = false;
var theIdToken;

// Turn on jQuery Ajax caching
$.ajaxSetup({ cache: true });

// Material icons
var matIconExitToApp = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                       '  <path d="M0 0h24v24H0z" fill="none"/>' +
                       '  <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>' +
                       '</svg>';
var matIconAccountCircle = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                           '  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>' +
                           '  <path d="M0 0h24v24H0z" fill="none"/>' +
                           '</svg>';
var matIconEdit = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                  '  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>' +
                  '  <path d="M0 0h24v24H0z" fill="none"/>' +
                  '</svg>';
var matIconMoreHoriz = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                       '  <path d="M0 0h24v24H0z" fill="none"/>' +
                       '  <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>' +
                       '</svg>';
var matIconExpandMore = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                        '  <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>' +
                        '  <path d="M0 0h24v24H0z" fill="none"/>' +
                        '</svg>';
var matIconCheckBox = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                      '  <path d="M0 0h24v24H0z" fill="none"/>' +
                      '  <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
                      '</svg>';
var matIconCheckBoxOutline = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                             '  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>' +
                             '  <path d="M0 0h24v24H0z" fill="none"/>' +
                             '</svg>';
var matIconRefresh = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                     '  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>' +
                     '  <path d="M0 0h24v24H0z" fill="none"/>' +
                     '</svg>';
var matIconDelete = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + 
                    '  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>' +
                    '  <path d="M0 0h24v24H0z" fill="none"/>' +
                    '</svg>';
var matIconCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                   '  <path d="M0 0h24v24H0z" fill="none"/>' +
                   '  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' +
                   '</svg>';
var matIconClear = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                   '  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>' +
                   '  <path d="M0 0h24v24H0z" fill="none"/>' +
                   '</svg>';
var matIconShare = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                   '  <path d="M0 0h24v24H0z" fill="none"/>' +
                   '  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>' +
                   '</svg>';


// History API Magic: Lifted from https://codepen.io/matt-west/pen/FGHAK
var defaultPage = 'donors';
var pages = {
  donors: { title: 'Blood MV', menu_element: 'donors', script: '/js/donors.js' },
  requests: { title: 'Requests :: Blood MV', menu_element: 'requests', script: '/js/requests.js' },
  requestsadd: { title: 'Add Request :: Blood MV', menu_element: 'requestsadd', script: '/js/requestsadd.js' },
  add: { title: 'Add Donor :: Blood MV', menu_element: 'add', script: '/js/add.js' },
  notify: { title: 'Notify :: Blood MV', menu_element: 'notify', script: '/js/notify.js' },
  admin: { title: 'Admin :: Blood MV', menu_element: 'admin', script: '/js/admin.js' }
};

var navLinks = document.querySelectorAll('nav .container > ul > li > a, #nav-mobile > li > a');
var contentElement = '#content';

function updateContent(stateObj, pageURL) {
  if (stateObj) {
    $(contentElement).load(pageURL + ' #content > *', function(){
      $.getScript(stateObj.script);
      document.title = stateObj.title;
      var desktopMenuElement = 'nav-d-' + stateObj.menu_element;
      var mobileMenuElement = 'nav-m-' + stateObj.menu_element;
      $('nav > .container > ul > li.active').removeClass('active');
      $('#nav-mobile > li.active').removeClass('active');
      $('#' + desktopMenuElement).addClass('active');
      $('#' + mobileMenuElement).addClass('active');
      ga('send', 'pageview');
    });
  }
}


for (var i = 0; i < navLinks.length; i++) {
  if($(navLinks[i]).parent().is('#nav-m-sign')) {
    // This is the sign in link on mobile nav
  } else if($(navLinks[i]).hasClass('dropdown-trigger')) {
    // This is the dropdown trigger for account link
  } else {
    navLinks[i].addEventListener('click', function(e) { // jshint ignore:line
      e.preventDefault();
      $('.progress').show();
      sidenavInstance.close();
      var pageURL = this.attributes.href.value;
      var pageData = pages[pageURL.replace(/\//g, '')];
      if(!pageData) {
        pageData = pages[defaultPage];
      }
      updateContent(pageData, pageURL);
      history.pushState(pageData, pageData.title, pageURL);
    });
  }
}

window.addEventListener('popstate', function(event) {
  var pageURL = event.currentTarget.location.pathname;
  updateContent(event.state, pageURL);
});


// Search within Table: Lifted from https://stackoverflow.com/a/43622296/289254
function tableSearch(searchElement, tableElement) {
  var filter = searchElement.value.toUpperCase();
  var filterOne = filter.split(' ')[0];
  var filterTwo = filter.split(' ')[1];
  var tr = tableElement.getElementsByTagName('tr');
  for (var i = 1; i < tr.length; i++) { // i should start from 1, not 0, if table header is to be always visible
    if(filterTwo) {
      if(tr[i].textContent.toUpperCase().indexOf(filterOne) > -1 && tr[i].textContent.toUpperCase().indexOf(filterTwo) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
      }
    } else {
      if(tr[i].textContent.toUpperCase().indexOf(filterOne) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
      }      
    }
  }
}


// Perform Login when login link is clicked
$('#drop-acc > li > a').on('click', function() {
  performLogin();
});
$('#nav-m-sign > a').on('click', function() {
  performLogin();
});


// Get a key's value from LocalStorage
function getKeyValueStore(key) {
  return window.localStorage.getItem(key) === '1';
}


// Set a key and its value in LocalStorage
function setKeyValueStore(key, value) {
  window.localStorage.setItem(key, value ? '1' : '0');
}


// Get a key's value from SessionStorage
function getSessionStore(key) {
  return window.sessionStorage.getItem(key) === '1';
}


// Set a key and its value in SessionStorage
function setSessionStore(key, value) {
  window.sessionStorage.setItem(key, value ? '1' : '0');
}


// Calculate and return age
function age(dob) {
  dob = new Date(dob);
  var today = new Date();
  var age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
  return age;
}


// Dates for the humans
function humanDate(date, returnTime) {
  date = new Date(date);
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if(returnTime == true) {
    return ('0' + date.getDate()).slice(-2) +
           '-' + monthNames[date.getMonth()] +
           '-' + date.getFullYear() +
           ' '  + ('0' + date.getHours()).slice(-2) +
           ':' + ('0' + date.getMinutes()).slice(-2);
  } else {
    return ('0' + date.getDate()).slice(-2) +
           '-' + monthNames[date.getMonth()] +
           '-' + date.getFullYear();
  }
}


// Dates for HTML input elements
function htmlDate(date, returnTime) {
  date = new Date(date);
  var monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '1', '12'];
  if(returnTime == true) {
    return date.getFullYear() +
           '-' + monthNames[date.getMonth()] +
           '-' + ('0' + date.getDate()).slice(-2) +
           ' '  + ('0' + date.getHours()).slice(-2) +
           ':' + ('0' + date.getMinutes()).slice(-2);
  } else {
    return date.getFullYear() +
           '-' + monthNames[date.getMonth()] +
           '-' + ('0' + date.getDate()).slice(-2);
  }
}


// Perform the login process
function performLogin() {
  firebase.auth().signInWithRedirect(provider).then(function(result) {
    console.log(result.user);
  }).catch(function(error) {
    console.error(error);
  });
}


// Perform the logout process
function performLogout() {
  firebase.auth().signOut().then(function() {
    console.log('Signout Succesfull');
  }, function(error) {
    console.error('Signout Failed');
    console.error(error);
  });
}

// Trim text to a specific number of characters, add ellipsis and return
function trim(textToTrim, numCharacters) {
  if(textToTrim.length > numCharacters) {
    return textToTrim.substring(0, textToTrim.length - (textToTrim.length - numCharacters) - 3) + '...';
  } else {
    return textToTrim;
  }
}


// Update auth details on load / when auth status changes
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $('#drop-acc > li > .title').text(trim(user.displayName, 25));
    $('#nav-mobile > li > div.user-view > .name').text(trim(user.displayName, 25));
    $('#drop-acc > li > .email').text(trim(user.email, 25));
    $('#nav-mobile > li > div.user-view > .email').text(trim(user.email, 25));
    $('#drop-acc > li > svg').replaceWith('<img src="' + user.photoURL + '" alt="Avatar">');
    $('#nav-mobile > li > div.user-view > svg').replaceWith('<img src="' + user.photoURL + '" alt="Avatar">');
    $('#drop-acc > li > a').text('Sign out').off().on('click', function(){
      performLogout();
    });
    $('#nav-m-sign > a').html(matIconExitToApp + 'Sign out').off().on('click', function(){
      performLogout();
    });
    db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        authStatusUpdated = true;
        $('#nav-d-add > a').text('Edit my details');
        $('#nav-m-add > a').html(matIconEdit + 'Edit my details');
      });
    });
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
      if (!!idTokenResult.claims.admin) {
        isAdmin = true;
        user.getIdToken().then(function(idToken) {
          theIdToken = idToken;
        });
        $('#nav-d-admin').show();
        $('#nav-m-admin').show();
        $('#drop-acc > li > .title').text(trim(user.displayName, 17) + ' (Admin)');
        $('#nav-mobile > li > div.user-view > .name').text(trim(user.displayName, 17) + ' (Admin)');
      }
    })
    .catch((error) => {
      console.log(error);
    });
  } else {
    $('#drop-acc > li > .title').text('Not Signed in');
    $('#nav-mobile > li > div.user-view > .name').text('Not Signed in');
    $('#drop-acc > li > .email').text('Sign in to add / edit records');
    $('#nav-mobile > li > div.user-view > .email').text('Sign in to add / edit records');
    $('#drop-acc > li > img').replaceWith(matIconAccountCircle);
    $('#nav-mobile > li > div.user-view > img').replaceWith(matIconAccountCircle);
    $('#drop-acc > li > a').text('Sign in').off().on('click', function(){
      performLogin();
    });
    $('#nav-m-sign > a').html(matIconExitToApp + 'Sign in').off().on('click', function(){
      performLogin();
    });
  }
});


// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker `messaging.setBackgroundMessageHandler` handler. // TODO: Check this condition
messaging.onMessage(function(payload) {
  console.log('Message received. ', payload);
  M.toast({
    html: '<a href="' + payload.data.click_action + '">' + payload.data.body.replace('\n', '<br>') + '</a>',
    displayLength: 10000
  });
});


var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt triggered');
  ga('send', 'event', 'A2H', 'triggered');
  if(getSessionStore('hideA2HS')) {
    console.log('User has closed A2HS banner before. It is hidden for this session.');
  } else {
    showAddToHomeScreen();
  }
});


window.addEventListener('appinstalled', function(event) {
  ga('send', 'event', 'A2H', 'installed');
});


function showAddToHomeScreen() {
  $('.a2hs-banner').show();
  $('.a2hs-add').on('click', addToHomeScreen);
}


function addToHomeScreen() {
  $('.a2hs-banner').hide();
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(choiceResult) {
    ga('send', 'event', 'A2H', choiceResult.outcome);
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  });
}


$('.a2hs-close').on('click', function() {
  setSessionStore('hideA2HS', true);
  $('.a2hs-banner').hide();
  ga('send', 'event', 'A2H', 'closed');
});


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
  .then((registration) => {
    messaging.useServiceWorker(registration);
    console.log('[SW] Service worker is all cool.');
  }).catch(function(e) {
    console.error('[SW] Service worker is not so cool.', e);
    throw e;
  });
}


/* jshint ignore:start */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-128907524-1', 'auto');
ga('set', 'dimension1', 'online');
ga('send', 'pageview');
/* jshint ignore:end */

if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({usage, quota}) => {
    var usageInMB = (usage / 1024 / 1024).toFixed(2);
    var quotaInMB = (quota / 1024 / 1024).toFixed(2);
    ga('send', 'event', 'StorageQuota', quotaInMB);
    ga('send', 'event', 'StorageUsage', usageInMB);
  });
}
