/*jshint esversion: 6 */
/*globals $, firebase */
/*exported requestPermission, deleteToken */

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

// Add the public key generated from the console here.
messaging.usePublicVapidKey('BL1aLfJpeXegbscdgQ5s0Zs95fo9EDXvgCnbGShysqEBbX60hoYPuUuY0zLH_IAsVp38mNqzBYetW3QtUb-24h0');

// Set global token
var theToken;


// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function() {
  messaging.getToken().then(function(refreshedToken) {
    console.log('Token refreshed.');
    setKeyValueStore('sentToServer', false);
    sendTokenToServer(refreshedToken);
    startProcess();
  }).catch(function(err) {
    console.error('Unable to retrieve refreshed token ', err);
    $('#result').text('Unable to retrieve refreshed token.');
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
      theToken = currentToken;
    } else {
      console.warn('No Instance ID token available. Request permission to generate one.');
      $('#result').text('Notification permission not requested.');
      $('#result').removeAttr('class').addClass('text-success');
      setKeyValueStore('notificationStatus', false);
      boxUnChecked();
    }
  }).catch(function(err) {
    console.error('An error occurred while retrieving token. ', err);
    $('#result').text('Error retrieving Instance ID token.');
    $('#result').removeAttr('class').addClass('text-danger');
    setKeyValueStore('notificationStatus', false);
    setKeyValueStore('sentToServer', false);
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
    if(getKeyValueStore('notificationStatus') == false) {
      console.log('Notifications were turned off. So, not requesting a token.');
      boxUnChecked();
    } else {
      getSubscritions();
      getToken();
    }
  } else {
    getSubscritions();
    getToken();
  }
}


$('.display-toggle').on('click', function(event) {
  if(Notification.permission == 'default') {
    $('.display-toggle i').text('refresh').addClass('icon-spin');
    requestPermission();
  }
  if($('.display-toggle i').text() == 'check_box_outline_blank') {
    if(getKeyValueStore('notificationStatus') == true) {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      startProcess();
      $('#allFields').removeAttr('disabled');
      $('.display-toggle i').text('check_box').removeClass('icon-spin');
    } else {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      setKeyValueStore('notificationStatus', true);
      startProcess();
    }
  } else if($('.display-toggle i').text() == 'check_box') {
    $('.display-toggle i').text('refresh').addClass('icon-spin');
    deleteToken();
  } else {
    console.warn('Some action is happening. Wait for a while!');
  }
});


$('#mainForm input[type=checkbox]').on('click', function(event) {
  var theTopic = $(event.target).attr('id');
  if($(event.target.nextSibling).attr('data-icon') != 'refresh') {
    $(event.target.nextSibling).attr('data-icon', 'refresh');
    if(event.target.checked) {
      $(event.target.parentNode).addClass('sub-loading');
      $.ajax({
        method: 'POST',
        dataType: 'json',
        url: 'subscribe',
        data: { topic: theTopic, token: theToken },
        success: function(data) {
          setKeyValueStore(theTopic, true);
          console.log('Subscribed to topic: ', theTopic, ' ', data);
          $('#result').text('Subscribed to: ' + theTopic);
          $('#result').removeAttr('class').addClass('text-success');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).addClass('sub-selected');
          $(event.target.nextSibling).attr('data-icon', 'check');
        },
        error: function(xhr, status, error) {
          console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
          $('#result').text('Something went wrong!');
          $('#result').removeAttr('class').addClass('text-danger');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).removeClass('sub-selected');
          $(event.target.nextSibling).attr('data-icon', 'add');
        },
      });
    } else {
      $.ajax({
        method: 'POST',
        dataType: 'json',
        url: 'unsubscribe',
        data: { topic: theTopic, token: theToken },
        success: function(data) {
          setKeyValueStore(theTopic, false);
          console.log('Unsubscribed from topic: ', theTopic, ' ', data);
          $('#result').text('Unsubscribed from: ' + theTopic);
          $('#result').removeAttr('class').addClass('text-success');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).removeClass('sub-selected');
          $(event.target.nextSibling).attr('data-icon', 'add');
        },
        error: function(xhr, status, error) {
          console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
          $('#result').text('Something went wrong!');
          $('#result').removeAttr('class').addClass('text-danger');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).addClass('sub-selected');
          $(event.target.nextSibling).attr('data-icon', 'check');
        },
      });
    }
  } else {
    console.log('Action already in progress, ignoring event!');
  }
});



function getSubscritions() {
  $('#mainForm input[type=checkbox]').each(function(box) {
    $(this).attr('data-icon', 'refresh').addClass('icon-spin');
    var theTopic = $(this).attr('id');
    if(getKeyValueStore(theTopic)) {
      $(this).prop('checked', 'checked');
      $(this).attr('data-icon', 'check_box').removeClass('icon-spin');
    } else {
      $(this).prop('checked', '');
      $(this).attr('data-icon', 'check_box_outline_blank').removeClass('icon-spin');
    }
  });
}


function resetSubscritions() {
  $('#mainForm input[type=checkbox]').each(function(box) {
    $(this).attr('data-icon', 'refresh').addClass('icon-spin');
    var theTopic = $(this).attr('id');
    if(getKeyValueStore(theTopic)) {
      setKeyValueStore(theTopic, false);
      $(this).prop('checked', 'checked');
    }
    $(this).attr('data-icon', 'check_box_outline_blank').removeClass('icon-spin');
  });
}


// Send the Instance ID token to your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
  if (!getKeyValueStore('sentToServer')) {
    boxUnChecked();
    $('.display-toggle i').text('refresh').addClass('icon-spin');
    console.log('Sending token to server...');
    setKeyValueStore('notificationStatus', false);
    $.ajax({
      method: 'POST',
      dataType: 'json',
      url: 'subscribe',
      data: { topic: 'all', token: currentToken },
      success: function(data) {
        setKeyValueStore('sentToServer', true);
        setKeyValueStore('notificationStatus', true);
        console.log('Subscripttion successful. ', data);
        $('#result').text('Subscripttion successful.');
        $('#result').removeAttr('class').addClass('text-success');
        boxChecked();
      },
      error: function(xhr, status, error) {
        console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
        $('#result').text('Something went wrong!');
        $('#result').removeAttr('class').addClass('text-danger');
        boxUnChecked();
        setKeyValueStore('notificationStatus', false);
      },
    });
  } else {
    boxChecked();
    setKeyValueStore('notificationStatus', true);
    console.log('Token already sent to server so won\'t send it again unless it changes');
  }
}


function boxChecked() {
  $('#allFields').removeAttr('disabled');
  $('ul.subs-groups').removeClass('disabled');
  $('.display-toggle i').text('check_box').removeClass('icon-spin');
}


function boxUnChecked() {
  $('#allFields').attr('disabled', 'disabled');
  $('ul.subs-groups').addClass('disabled');
  $('.display-toggle i').text('check_box_outline_blank').removeClass('icon-spin');
  $('input:checkbox').prop('checked', '');
}


function getKeyValueStore(key) {
  return window.localStorage.getItem(key) === '1';
}


function setKeyValueStore(key, value) {
  window.localStorage.setItem(key, value ? '1' : '0');
}


function requestPermission() {
  console.log('Requesting permission...');
  messaging.requestPermission().then(function() {
    console.log('Notification permission granted.');
    $('#result').text('Notification permission granted.');
    $('#result').removeAttr('class').addClass('text-success');
    setKeyValueStore('notificationStatus', true);
    startProcess();
  }).catch(function(err) {
    console.error('Unable to get permission to notify.', err);
    $('#result').text('Unable to get permission to notify.');
    $('#result').removeAttr('class').addClass('text-danger');
    startProcess();
  });
}


function deleteToken() {
  messaging.getToken().then(function(currentToken) {
    messaging.deleteToken(currentToken).then(function() {
      console.log('Token deleted.');
      setKeyValueStore('sentToServer', false);
      setKeyValueStore('notificationStatus', false);
      $('#result').text('Notifications turned off.');
      $('#result').removeAttr('class').addClass('text-success');
      resetSubscritions();
      boxUnChecked();
    }).catch(function(err) {
      console.error('Unable to delete token. ', err);
      $('#result').text('Unable to delete token.');
      $('#result').removeAttr('class').addClass('text-danger');
      boxChecked();
    });
  }).catch(function(err) {
    console.error('Error retrieving Instance ID token. ', err);
    $('#result').text('Error retrieving Instance ID token.');
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
