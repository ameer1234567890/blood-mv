/*jshint esversion: 6 */
/*globals $, firebase */
/* exported tableSearch, getKeyValueStore, setKeyValueStore, age, humanDate, htmlDate, topLoader */

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
var topLoader = '.progress';
var authStatusUpdated = false;

// Turn on jQuery Ajax caching
$.ajaxSetup({ cache: true });


// History API Magic: Lifted from https://codepen.io/matt-west/pen/FGHAK
var defaultPage = 'donors';
var pages = {
  donors: { title: 'Blood MV', menu_element: 'donors', script: '/js/donors.js' },
  requests: { title: 'Requests :: Blood MV', menu_element: 'requests', script: '/js/requests.js' },
  requestsadd: { title: 'Add Request :: Blood MV', menu_element: 'requestsadd', script: '/js/requestsadd.js' },
  add: { title: 'Add Donor :: Blood MV', menu_element: 'add', script: '/js/add.js' },
  notify: { title: 'Notify :: Blood MV', menu_element: 'notify', script: '/js/notify.js' }
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
    $('#drop-acc > li > .circle').replaceWith('<img src="' + user.photoURL + '" alt="Avatar">');
    $('#nav-mobile > li > div.user-view > .circle').replaceWith('<img src="' + user.photoURL + '" alt="Avatar">');
    $('#drop-acc > li > a').text('Sign out').off().on('click', function(){
      performLogout();
    });
    $('#nav-m-sign > a').html('<i class="material-icons">exit_to_app</i>Sign out').off().on('click', function(){
      performLogout();
    });
    db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        authStatusUpdated = true;
        $('#nav-d-add > a').text('Edit my details');
        $('#nav-m-add > a').html('<i class="material-icons">edit</i>Edit my details');
      });
    });
  } else {
    $('#drop-acc > li > .title').text('Not Signed in');
    $('#nav-mobile > li > div.user-view > .name').text('Not Signed in');
    $('#drop-acc > li > .email').text('Sign in to add / edit records');
    $('#nav-mobile > li > div.user-view > .email').text('Sign in to add / edit records');
    $('#drop-acc > li > img').replaceWith('<i class="material-icons circle white-text">account_circle</i>');
    $('#nav-mobile > li > div.user-view > img').replaceWith('<i class="material-icons circle white-text">account_circle</i>');
    $('#drop-acc > li > a').text('Sign in').off().on('click', function(){
      performLogin();
    });
    $('#nav-m-sign > a').html('<i class="material-icons">exit_to_app</i>Sign in').off().on('click', function(){
      performLogin();
    });
  }
});


var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt triggered');
  showAddToHomeScreen();
});


function showAddToHomeScreen() {
  $('.a2hs-banner').show();
  $('.a2hs-add').on('click', addToHomeScreen);
}


function addToHomeScreen() {
  $('.a2hs-banner').hide();
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(choiceResult) {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  });
}


$('.a2hs-close').on('click', function() {
  $('.a2hs-banner').hide();
});


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/js/sw.js')
  .then((registration) => {
    messaging.useServiceWorker(registration);
    console.log('[SW] Service worker is all cool.');
  }).catch(function(e) {
    console.error('[SW] Service worker is not so cool.', e);
    throw e;
  });
}
