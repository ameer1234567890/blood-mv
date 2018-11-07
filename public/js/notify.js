/*jshint esversion: 6 */
/*globals $, topLoader, messaging, setKeyValueStore, getKeyValueStore, M, matIconCheckBox, matIconCheckBoxOutline, matIconRefresh */
/*exported showNotification */

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
    $('#result').addClass('red-text');
  });
});


// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker `messaging.setBackgroundMessageHandler` handler. // TODO: Check this condition
messaging.onMessage(function(payload) {
  console.log('Message received. ', payload);
  M.toast({
    html: payload.notification.body,
    displayLength: 10000
  });
});


function getToken() {
  // Get Instance ID token. Initially this makes a network call, once retrieved subsequent calls to getToken will return from cache.
  messaging.getToken().then(function(currentToken) {
    if (currentToken) {
      sendTokenToServer(currentToken);
      console.log('Token: ' + currentToken);
      $('#result').text('Notifications turned on.');
      $('#result').removeAttr('class').addClass('green-text');
      theToken = currentToken;
    } else {
      console.warn('No Instance ID token available. Request permission to generate one.');
      $('#result').text('Notification permission not requested.');
      $('#result').removeAttr('class').addClass('green-text');
      setKeyValueStore('notificationStatus', false);
      boxUnChecked();
    }
  }).catch(function(err) {
    console.error('An error occurred while retrieving token. ', err);
    $('#result').text('Error retrieving Instance ID token.');
    $('#result').removeAttr('class').addClass('red-text');
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
    $('#result').removeAttr('class').addClass('red-text');
    $('#display-toggle span').addClass('disabled');
    $('#display-toggle').off();
  } else if(Notification.permission == 'granted') {
    if(getKeyValueStore('notificationStatus') == false) {
      console.log('Notifications were turned off. So, not requesting a token.');
      boxUnChecked();
      resetSubscritions();
    } else {
      getSubscritions();
      getToken();
    }
  } else {
    getSubscritions();
    getToken();
  }
}


$('#display-toggle').on('click', function(event) {
  if(Notification.permission == 'default') {
    $('#display-toggle span').html(matIconRefresh).addClass('icon-spin').attr('data-checked', 'loading');
    requestPermission();
  }
  if(!$('#display-toggle span').attr('data-checked')) {
    if(getKeyValueStore('notificationStatus') == true) {
      $('#display-toggle span').html(matIconRefresh).addClass('icon-spin').attr('data-checked', 'loading');
      startProcess();
      $('#allFields').removeAttr('disabled');
      $('#display-toggle span').html(matIconCheckBox).removeClass('icon-spin').attr('data-checked', 'checked');
    } else {
      $('#display-toggle span').html(matIconRefresh).addClass('icon-spin').attr('data-checked', 'loading');
      setKeyValueStore('notificationStatus', true);
      startProcess();
    }
  } else if($('#display-toggle span').attr('data-checked') == 'checked') {
    $('#display-toggle span').html(matIconRefresh).addClass('icon-spin').attr('data-checked', 'loading');
    deleteToken();
  } else if($('#display-toggle span').attr('data-checked') == 'loading') {
    console.warn('Some action is happening. Wait for a while!');
  }
});


$('#mainForm input[type=checkbox]').on('click', function(event) {
  var theTopic = $(event.target).attr('id');
  if($(event.target).attr('data-status') != 'loading') {
    $(event.target).attr('data-status', 'loading');
    $(event.target.parentNode).addClass('sub-loading');
    if(event.target.checked) {
      $.ajax({
        method: 'POST',
        dataType: 'json',
        url: '/notify/subscribe',
        data: { topic: theTopic, token: theToken },
        success: function(data) {
          setKeyValueStore(theTopic, true);
          console.log('Subscribed to topic: ', theTopic, ' ', data);
          $('#result').text('Subscribed to: ' + theTopic);
          $('#result').removeAttr('class').addClass('green-text');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).addClass('sub-selected');
          $(event.target).attr('data-status', 'checked');
        },
        error: function(xhr, status, error) {
          console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
          $('#result').text('Something went wrong!');
          $('#result').removeAttr('class').addClass('red-text');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).removeClass('sub-selected');
          $(event.target).removeAttr('data-status');
          $(event.target).prop('checked', '');
        },
      });
    } else {
      $.ajax({
        method: 'POST',
        dataType: 'json',
        url: '/notify/unsubscribe',
        data: { topic: theTopic, token: theToken },
        success: function(data) {
          setKeyValueStore(theTopic, false);
          console.log('Unsubscribed from topic: ', theTopic, ' ', data);
          $('#result').text('Unsubscribed from: ' + theTopic);
          $('#result').removeAttr('class').addClass('green-text');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).removeClass('sub-selected');
          $(event.target).removeAttr('data-status');
        },
        error: function(xhr, status, error) {
          console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
          $('#result').text('Something went wrong!');
          $('#result').removeAttr('class').addClass('red-text');
          $(event.target.parentNode).removeClass('sub-loading');
          $(event.target.parentNode).addClass('sub-selected');
          $(event.target).attr('data-status', 'checked');
          $(event.target).prop('checked', 'checked');
        },
      });
    }
  } else {
    console.log('Action already in progress, ignoring event!');
  }
});



function getSubscritions() {
  $('#mainForm input[type=checkbox]').each(function() {
    var theTopic = $(this).attr('id');
    if(getKeyValueStore(theTopic)) {
      $(this).prop('checked', 'checked');
      $(this).attr('data-status', 'checked');
      $(this.parentNode).addClass('sub-selected');
    } else {
      $(this).prop('checked', '');
      $(this).removeAttr('data-status');
      $(this.parentNode).removeClass('sub-selected');
    }
  });
}


function resetSubscritions() {
  $('#mainForm input[type=checkbox]').each(function() {
    $(this).attr('data-status', 'loading').addClass('icon-spin');
    var theTopic = $(this).attr('id');
    if(getKeyValueStore(theTopic)) {
      setKeyValueStore(theTopic, false);
      $(this).prop('checked', 'checked');
    }
    $(this).removeAttr('data-icon');
    $(this.parentNode).removeClass('sub-selected');
  });
}


// Send the Instance ID token to your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
  if (!getKeyValueStore('sentToServer')) {
    boxUnChecked();
    $('#display-toggle span').html(matIconRefresh).addClass('icon-spin').attr('data-checked', 'loading');
    console.log('Sending token to server...');
    setKeyValueStore('notificationStatus', false);
    $.ajax({
      method: 'POST',
      dataType: 'json',
      url: '/notify/subscribe',
      data: { topic: 'all', token: currentToken },
      success: function(data) {
        setKeyValueStore('sentToServer', true);
        setKeyValueStore('notificationStatus', true);
        console.log('Subscription successful. ', data);
        $('#result').text('Subscription successful.');
        $('#result').removeAttr('class').addClass('green-text');
        boxChecked();
      },
      error: function(xhr, status, error) {
        console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
        $('#result').text('Something went wrong!');
        $('#result').removeAttr('class').addClass('red-text');
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
  $('#display-toggle span').html(matIconCheckBox).removeClass('icon-spin').attr('data-checked', 'checked');
}


function boxUnChecked() {
  $('#allFields').attr('disabled', 'disabled');
  $('ul.subs-groups').addClass('disabled');
  $('#display-toggle span').html(matIconCheckBoxOutline).removeClass('icon-spin').removeAttr('data-checked');
  $('input:checkbox').prop('checked', '');
}


function requestPermission() {
  console.log('Requesting permission...');
  messaging.requestPermission().then(function() {
    console.log('Notification permission granted.');
    $('#result').text('Notification permission granted.');
    $('#result').removeAttr('class').addClass('green-text');
    setKeyValueStore('notificationStatus', true);
    startProcess();
  }).catch(function(err) {
    console.error('Unable to get permission to notify.', err);
    $('#result').text('Unable to get permission to notify.');
    $('#result').removeAttr('class').addClass('red-text');
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
      $('#result').removeAttr('class').addClass('green-text');
      resetSubscritions();
      boxUnChecked();
    }).catch(function(err) {
      console.error('Unable to delete token. ', err);
      $('#result').text('Unable to delete token.');
      $('#result').removeAttr('class').addClass('red-text');
      boxChecked();
    });
  }).catch(function(err) {
    console.error('Error retrieving Instance ID token. ', err);
    $('#result').text('Error retrieving Instance ID token.');
    $('#result').removeAttr('class').addClass('red-text');
    boxChecked();
  });
}


function showNotification(payload) {
  var notificationTitle = payload.notification.title;
  var notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png',
    badge: '/icons/badge.png',
    click_action: '/request/'
  };
  return new Notification(notificationTitle, notificationOptions);
}


startProcess();


$(document).ready($(topLoader).hide());
