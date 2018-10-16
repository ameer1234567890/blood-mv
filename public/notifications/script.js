/*jshint esversion: 6 */
/*globals $, firebase */
/*exported requestPermission, deleteToken */

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

// Add the public key generated from the console here.
messaging.usePublicVapidKey('BL1aLfJpeXegbscdgQ5s0Zs95fo9EDXvgCnbGShysqEBbX60hoYPuUuY0zLH_IAsVp38mNqzBYetW3QtUb-24h0');


// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function() {
  messaging.getToken().then(function(refreshedToken) {
    console.log('Token refreshed.');
    setTokenSentToServer(false);
    sendTokenToServer(refreshedToken);
    startProcess();
  }).catch(function(err) {
    console.error('Unable to retrieve refreshed token ', err);
    $('#result').text('Unable to retrieve refreshed token ' + err);
    $('#result').addClass('text-danger');
  });
});


// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker `messaging.setBackgroundMessageHandler` handler. // TODO: Check this condition
messaging.onMessage(function(payload) {
  console.log('Message received. ', payload);
  showNotification(payload);
});


function getToken() {
  // Get Instance ID token. Initially this makes a network call, once retrieved subsequent calls to getToken will return from cache.
  messaging.getToken().then(function(currentToken) {
    if (currentToken) {
      sendTokenToServer(currentToken);
      console.log('Token: ' + currentToken);
      $('#result').text('Notifications turned on.');
      $('#result').removeAttr('class').addClass('text-success');
    } else {
      console.warn('No Instance ID token available. Request permission to generate one.');
      $('#result').text('Notification permission not requested.');
      $('#result').removeAttr('class').addClass('text-success');
      boxUnChecked();
    }
  }).catch(function(err) {
    console.error('An error occurred while retrieving token. ', err);
    $('#result').text('Error retrieving Instance ID token. ' + err);
    $('#result').removeAttr('class').addClass('text-danger');
    setTokenSentToServer(false);
    boxUnChecked();
  });
}


function startProcess() {
  if (Notification.permission == 'denied') {
    boxUnChecked();
    console.warn('The user has blocked notifications.');
    $('#result').text('Notification permission has been blocked!');
    $('#result').removeAttr('class').addClass('text-danger');
    $('.display-toggle i').addClass('disabled');
    $('.display-toggle').off('click');
  } else if(Notification.permission == 'granted') {
    if(getNotificationStatus() == false) {
      console.log('Notifications were turned off. So, not requesting a token.');
      boxUnChecked();
    } else {
      getToken();
    }
  } else {
    getToken();
  }
}


$('.display-toggle').on('click', function(event) {
  if(Notification.permission == 'default') {
    $('.display-toggle i').replaceWith('<i class="fas fa-circle-notch fa-spin"></i>');
    requestPermission();
  }
  if($('.display-toggle i').text() == 'check_box_outline_blank') {
    if(getNotificationStatus() == true) {
      $('.display-toggle i').replaceWith('<i class="fas fa-circle-notch fa-spin"></i>');
      startProcess();
      $('#allFields').removeAttr('disabled');
      $('.display-toggle i').replaceWith('<i class="material-icons">check_box</i>');
    } else {
      $('.display-toggle i').replaceWith('<i class="fas fa-circle-notch fa-spin"></i>');
      startProcess();
    }
  } else if($('.display-toggle i').text() == 'check_box') {
    $('.display-toggle i').replaceWith('<i class="fas fa-circle-notch fa-spin"></i>');
    deleteToken();
  } else {
    console.warn('Some action is happening. Wait for a while!');
  }
});


// Send the Instance ID token to your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
  if (!isTokenSentToServer()) {
    boxUnChecked();
    $('.display-toggle i').replaceWith('<i class="fas fa-circle-notch fa-spin"></i>');
    console.log('Sending token to server...');
    $.ajax({
      method: 'POST',
      dataType: "json",
      url: 'subscribe',
      data: { topic: 'all', token: currentToken },
      success: function (data) {
        setTokenSentToServer(true);
        setNotificationStatus(true);
        console.log('Subscripttion successful. ', data);
        $('#result').text('Subscripttion successful.');
        $('#result').removeAttr('class').addClass('text-success');
        boxChecked();
      },
      error: function (xhr, status, error) {
        console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
        $('#result').text('Something went wrong!');
        $('#result').removeAttr('class').addClass('text-danger');
        boxUnChecked();
      },
    });
  } else {
    boxChecked();
    setNotificationStatus(true);
    console.log('Token already sent to server so won\'t send it again unless it changes');
  }
}


function boxChecked() {
  $('#allFields').removeAttr('disabled');
  $('.display-toggle i').replaceWith('<i class="material-icons">check_box</i>');
}


function boxUnChecked() {
  $('#allFields').attr('disabled', 'disabled');
  $('.display-toggle i').replaceWith('<i class="material-icons">check_box_outline_blank</i>');
  $('input:checkbox').prop('checked', '');
}


function isTokenSentToServer() {
  return window.localStorage.getItem('sentToServer') === '1';
}


function setTokenSentToServer(sent) {
  window.localStorage.setItem('sentToServer', sent ? '1' : '0');
}


function getNotificationStatus() {
  return window.localStorage.getItem('notificationStatus') === '1';
}


function setNotificationStatus(status) {
  window.localStorage.setItem('notificationStatus', status ? '1' : '0');
}


function requestPermission() {
  console.log('Requesting permission...');
  messaging.requestPermission().then(function() {
    console.log('Notification permission granted.');
    $('#result').text('Notification permission granted.');
    $('#result').removeAttr('class').addClass('text-success');
    startProcess();
  }).catch(function(err) {
    console.error('Unable to get permission to notify.', err);
    $('#result').text('Unable to get permission to notify. ' + err);
    $('#result').removeAttr('class').addClass('text-danger');
    startProcess();
  });
}


function deleteToken() {
  messaging.getToken().then(function(currentToken) {
    messaging.deleteToken(currentToken).then(function() {
      console.log('Token deleted.');
      setTokenSentToServer(false);
      setNotificationStatus(false);
      $('#result').text('Notifications turned off.');
      $('#result').removeAttr('class').addClass('text-success');
      boxUnChecked();
    }).catch(function(err) {
      console.error('Unable to delete token. ', err);
      $('#result').text('Unable to delete token. ' + err);
      $('#result').removeAttr('class').addClass('text-danger');
      boxChecked();
    });
  }).catch(function(err) {
    console.error('Error retrieving Instance ID token. ', err);
    $('#result').text('Error retrieving Instance ID token. ' + err);
    $('#result').removeAttr('class').addClass('text-danger');
    boxChecked();
  });
}


function showNotification(payload) {
  var notificationTitle = payload.notification.title;
  var notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    badge: payload.notification.badge,
    click_action: payload.notification.click_action
  };
  return new Notification(notificationTitle, notificationOptions);
}


$('#spinner').hide();
startProcess();
