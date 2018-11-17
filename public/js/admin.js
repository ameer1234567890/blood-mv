/*jshint esversion: 6 */
/*globals $, firebase, db, provider, topLoader, authStatusUpdated */

var nonAdminMessage = '<div class="container"><br><br>Please login with an admin capable user!<br><br><br><br><br><br><br></div>';

$(document).ready(function() {
  if(authStatusUpdated) {
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
      if (!!idTokenResult.claims.admin) {
        $('#content').show();
      } else {
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
            $('#content').show();
          } else {
            $('#content').html(nonAdminMessage).show();
          }
        })
        .catch((error) => {
          console.log(error);
        });
      } else {
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
  var theTopic = $('#send-message-topic').val();
  var theMessage = $('#send-message-message').val();
  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: '/notify/sendmsg',
    data: { topic: theTopic, message: theMessage },
    success: function(data) {
      console.log('Message sent: ', data);
      $('#send-message-result').text('Message sent: ' + JSON.stringify(data)).removeAttr('class').addClass('green-text');
      $('#send-message-loader').hide();
      $('#send-message').removeAttr('disabled');
    },
    error: function(xhr, status, error) {
      console.error('Something went wrong! ', status,' ', error);
      $('#send-message-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
      $('#send-message-loader').hide();
      $('#send-message').removeAttr('disabled');
    },
  });
});


$('#list-users').on('click', function() {
  $('#list-users').attr('disabled', 'disabled');
  $('#list-users-loader').css('display', 'inline-block');
  $('#list-users-result').text('Processing...').addClass('blue-text');
  $.ajax({
    method: 'GET',
    dataType: 'json',
    url: '/admin/listusers',
    success: function(data) {
      var usersTable = '<table id="users" class="striped"><thead><tr><th>Name</th><th>Email</th><th>Avatar</th><th>Admin?</th></tr></thead><tobody>';
      for (var user in data) {
        if(user) {
          usersTable += '<tr>';
          usersTable += '<td>' + data[user].displayName + '</td>';
          usersTable += '<td>' + data[user].email + '</td>';
          usersTable += '<td><img src="' + data[user].photoURL + '" width="25" alt="Avatar"></td>';
          if(data[user].customClaims && data[user].customClaims.admin) {
            usersTable += '<td>' + data[user].customClaims.admin + '</td>';
          } else {
            usersTable += '<td>&nbsp;</td>';
          }
          usersTable += '</tr>';
        }
      }
      usersTable += '</tobody></table>';
      $('#list-users-result').html(usersTable).removeAttr('class');
      $('#list-users-loader').hide();
      $('#list-users').removeAttr('disabled');
    },
    error: function(xhr, status, error) {
      console.error('Something went wrong! ', status,' ', error);
      $('#list-users-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
      $('#list-users-loader').hide();
      $('#list-users').removeAttr('disabled');
    },
  });
});


$(document).ready($(topLoader).hide());
