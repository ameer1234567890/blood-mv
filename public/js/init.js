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

// Initialize sidenav, dropdown & tooltips
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
                             '<path fill="none" d="M0 0h24v24H0V0z"/>' +
                             '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/>' +
                           '</svg>';
var matIconEdit = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                    '<path fill="none" d="M0 0h24v24H0V0z"/>' +
                    '<path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>' +
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
                        '<path fill="none" d="M0 0h24v24H0V0z"/>' +
                        '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z"/>' +
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
                      '<path fill="none" d="M0 0h24v24H0V0z"/>' +
                      '<path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>' +
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
                     '<path fill="none" d="M0 0h24v24H0V0z"/>' +
                     '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>' +
                   '</svg>';


/* jshint ignore:start */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
/* jshint ignore:end */

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

var navLinks = document.querySelectorAll('#nav-desktop-right > li > a, #nav-mobile > li > a, #fab-addrequest');
var contentElement = '#content';

function updateContent(stateObj, pageURL) {
  if (stateObj) {
    $(contentElement).load(pageURL + ' #content > *', function(){
      $.getScript(stateObj.script);
      document.title = stateObj.title;
      $(contentElement).removeClass('slide');
      setTimeout(function() {$(contentElement).addClass('slide');}, 0);
      var desktopMenuElement = 'nav-d-' + stateObj.menu_element;
      var mobileMenuElement = 'nav-m-' + stateObj.menu_element;
      $('nav > .container > ul > li.active').removeClass('active');
      $('#nav-mobile > li.active').removeClass('active');
      $('#' + desktopMenuElement).addClass('active');
      $('#' + mobileMenuElement).addClass('active');
      ga('send', 'pageview', pageURL);
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


// Dates for homo sapiens
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
  var monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
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


// Relative dates: Lifted from https://github.com/azer/relative-date
var SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    YEAR = DAY * 365,
    MONTH = YEAR / 12;

var formats = [
  [ 0.7 * MINUTE, 'just now' ],
  [ 1.5 * MINUTE, 'a minute ago' ],
  [ 60 * MINUTE, 'minutes ago', MINUTE ],
  [ 1.5 * HOUR, 'an hour ago' ],
  [ DAY, 'hours ago', HOUR ],
  [ 2 * DAY, 'yesterday' ],
  [ 7 * DAY, 'days ago', DAY ],
  [ 1.5 * WEEK, 'a week ago'],
  [ MONTH, 'weeks ago', WEEK ],
  [ 1.5 * MONTH, 'a month ago' ],
  [ YEAR, 'months ago', MONTH ],
  [ 1.5 * YEAR, 'a year ago' ],
  [ Number.MAX_VALUE, 'years ago', YEAR ]
];

function relativeDate(input,reference){
  !reference && ( reference = (new Date()).getTime() ); // jshint ignore:line
  reference instanceof Date && ( reference = reference.getTime() ); // jshint ignore:line
  input instanceof Date && ( input = input.getTime() ); // jshint ignore:line
  var delta = reference - input,
      format, i, len;
  for(i = -1, len=formats.length; ++i < len; ){
    format = formats[i];
    if(delta < format[0]){
      return format[2] == undefined ? format[1] : Math.round(delta/format[2]) + ' ' + format[1];
    }
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


// Add an animation to the refresh icon in navbar
$('#nav-mobile-right > li > .refresh').on('click', function() {
  $('#nav-mobile-right > li > .refresh').find('svg').addClass('icon-spin');
});


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
    authStatusUpdated = true;
    if(!localStorage.getItem('donorId')) {
      db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          $('#nav-d-add > a').text('Edit my details');
          $('#nav-m-add > a').html(matIconEdit + 'Edit my details');
          localStorage.setItem('donorId', doc.id);
        });
        if(!localStorage.getItem('donorId')) {
          localStorage.setItem('donorId', 'none');
        }
      });
    } else if(localStorage.getItem('donorId') != 'none') {
      $('#nav-d-add > a').text('Edit my details');
      $('#nav-m-add > a').html(matIconEdit + 'Edit my details');
    }
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
      if (!!idTokenResult.claims.admin) {
        isAdmin = true;
        user.getIdToken().then(function(idToken) {
          theIdToken = idToken;
        });
        $('#nav-d-admin').css('display', 'block');
        $('#nav-m-admin').css('display', 'inline-block');
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
messaging.onMessage(function(payload) {
  console.log('Message received. ', payload);
  M.toast({
    html: '<a href="' + payload.data.click_action + '">' + payload.data.body.replace('\n', '<br>') + '</a>',
    displayLength: 10000
  });
});


ga('set', 'dimension2', 'No');
var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt triggered');
  ga('set', 'dimension2', 'Yes');
  if(getSessionStore('hideA2HS')) {
    console.log('User has closed A2HS banner before. It is hidden for this session.');
  } else {
    showAddToHomeScreen();
  }
});


ga('set', 'dimension3', 'No');
window.addEventListener('appinstalled', function(event) {
  ga('set', 'dimension3', 'Yes');
});


function showAddToHomeScreen() {
  $('.a2hs-banner').show();
  $('.a2hs-add').on('click', addToHomeScreen);
}


function addToHomeScreen() {
  $('.a2hs-banner').hide();
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(choiceResult) {
    ga('set', 'dimension4', choiceResult.outcome);
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


ga('create', 'UA-128907524-1', {'siteSpeedSampleRate': 100});
ga('set', 'screenResolution', window.outerWidth + 'x' + window.outerHeight);
ga('set', 'viewportSize', window.innerWidth + 'x' + window.innerHeight);
ga('set', 'dimension1', 'online');
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({usage, quota}) => {
    var usageInMB = Math.round(usage / 1024 / 1024);
    var quotaInMB = Math.round(quota / 1024 / 1024);
    ga('set', 'metric2', quotaInMB);
    ga('set', 'metric3', usageInMB);
  });
}
ga('send', 'pageview');
