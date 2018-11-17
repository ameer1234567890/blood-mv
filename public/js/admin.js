/*jshint esversion: 6 */
/*globals $, firebase, db, provider, topLoader, authStatusUpdated */

var nonAdminMessage = '<div class="container"><br><br>Please login with an admin capable user!<br><br><br><br><br><br><br></div>';

$(document).ready(function() {
  if(authStatusUpdated) {
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
      if (!!idTokenResult.claims.admin) {
        console.log('You are admin');
        $('#content').show();
      } else {
        console.log('You are not admin');
        $('#content').html(nonAdminMessage).show();
      }
    })
    .catch((error) => {
      console.log(error);
    });
  } else {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
          if (!!idTokenResult.claims.admin) {
            console.log('You are admin');
            $('#content').show();
          } else {
            console.log('You are not admin');
            $('#content').html(nonAdminMessage).show();
          }
        })
        .catch((error) => {
          console.log(error);
        });
      } else {
        console.log('You are not admin');
        $('#content').html(nonAdminMessage).show();
      }
    });
  }
});

$('#add-claim').on('click', function() {
  firebase.auth().signInWithPopup(provider)
  .then((result) => {
    return result.user.getIdToken();
  })
  .then((idToken) => {
    $.post(
      '/admin/addclaim',
      {idToken: idToken},
      (data, status) => {
        if (status == 'success' && data) {
          const json = JSON.parse(data);
          if (json && json.status == 'success') {
            firebase.auth().currentUser.getIdToken(true);
            console.log('User token refreshed');
            firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
              console.log(idTokenResult.claims.admin);
               if (!!idTokenResult.claims.admin) {
                 console.log('You are admin');
               } else {
                 console.log('You are not admin');
               }
            })
            .catch((error) => {
              console.log(error);
            });
          }
        }
      });
  }).catch((error) => {
    console.log(error);
  });
});


$('#mark-fulfilled').on('click', function() {
  $('#mark-fulfilled').attr('disabled', 'disabled');
  $('#mark-fulfilled-loader').css('display', 'inline-block');
  $('#mark-fulfilled-result').text('Processing...').addClass('blue-text');
  var query;
  var d = new Date();
  var collectionName = 'requests.bak';
  var oneWeekBack = new Date(d.setDate(d.getDate() - 7));
  var i = 0;
  query = db.collection(collectionName).where('fulfilled', '==', 'false').where('datetime', '<', oneWeekBack);
  query.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      i++;
      console.log('Processing ' + doc.id + '...');
      db.collection(collectionName).doc(doc.id).update({
        fulfilled: 'true'
      })
      .then(function(docRef) {
        console.log('Marked ' + docRef + ' as fulfilled');
      })
      .catch(function(error) {
        console.error(error);
      });
    });
    $('#mark-fulfilled-result').text('Done processing ' + i + ' records.').removeAttr('class').addClass('green-text');
    $('#mark-fulfilled-loader').hide();
    $('#mark-fulfilled').removeAttr('disabled');
  });
});


$('#subscribe-token').on('click', function() {
  $('#subscribe-token').attr('disabled', 'disabled');
  $('#subscribe-token-loader').css('display', 'inline-block');
  $('#subscribe-token-result').text('Processing...').addClass('blue-text');
  var theToken = $('#subscribe-token-token').val();
  var theTopic = $('#subscribe-token-topic').val();
  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: '/notify/subscribe',
    data: { topic: theTopic, token: theToken },
    success: function(data) {
      console.log('Subscribed to topic: ', theTopic, ' ', data);
      $('#subscribe-token-result').text('Subscribed to: ' + theTopic).removeAttr('class').addClass('green-text');
      $('#subscribe-token-loader').hide();
      $('#subscribe-token').removeAttr('disabled');
    },
    error: function(xhr, status, error) {
      console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
      $('#subscribe-token-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
      $('#subscribe-token-loader').hide();
      $('#subscribe-token').removeAttr('disabled');
    },
  });
});


$('#token-details').on('click', function() {
  $('#token-details').attr('disabled', 'disabled');
  $('#token-details-loader').css('display', 'inline-block');
  $('#token-details-result').text('Processing...').addClass('blue-text');
  var theToken = $('#token-details-token').val();
  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: '/notify/tokendetails',
    data: { token: theToken },
    success: function(data) {
      console.log(data);
      $('#token-details-result').text(JSON.stringify(data)).removeAttr('class').addClass('green-text');
      $('#token-details-loader').hide();
      $('#token-details').removeAttr('disabled');
    },
    error: function(xhr, status, error) {
      console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
      $('#token-details-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
      $('#token-details-loader').hide();
      $('#token-details').removeAttr('disabled');
    },
  });
});


$('#send-message').on('click', function() {
  $('#send-message').attr('disabled', 'disabled');
  $('#send-message-loader').css('display', 'inline-block');
  $('#send-message-result').text('Processing...').addClass('blue-text');
  setTimeout(function() {
    $('#send-message-result').text('Someting happened.');
    $('#send-message-loader').hide();
    $('#send-message').removeAttr('disabled');
  }, 3000);
});


$('#list-users').on('click', function() {
  $('#list-users').attr('disabled', 'disabled');
  $('#list-users-loader').css('display', 'inline-block');
  $('#list-users-result').text('Processing...').addClass('blue-text');
  setTimeout(function() {
    $('#list-users-result').text('Someting happened.');
    $('#list-users-loader').hide();
    $('#list-users').removeAttr('disabled');
  }, 3000);
});


$(document).ready($(topLoader).hide());
