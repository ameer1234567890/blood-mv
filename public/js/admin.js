/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, firebase, db, topLoader, theIdToken:true, authStatusUpdated, isAdmin:true,
   matIconDelete, matIconRefresh, matIconCheck, matIconClear, humanDate */


var nonAdminMessage = '<div class="container"><br><br>Please login with an admin capable user!<br><br><br><br><br><br><br></div>';

$(document).ready(function() {
  if(authStatusUpdated) {
    if(isAdmin) {
      $('#content').show();
    } else {
      $('#content').html(nonAdminMessage).show();
    }
  } else {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
          if (!!idTokenResult.claims.admin) {
            $('#content').show();
            isAdmin = true;
            user.getIdToken().then(function(idToken) {
              theIdToken = idToken;
            });
          } else {
            $('#content').html(nonAdminMessage).show();
          }
        })
        .catch((error) => {
          console.log(error);
          $('#content').html('Something went wrong!').show();
        });
      } else {
        $('#content').html(nonAdminMessage).show();
      }
    });
  }
});

$('#add-claim').on('click', function() {
  $('#add-claim').attr('disabled', 'disabled');
  $('#add-claim-loader').css('display', 'inline-block');
  $('#add-claim-result').text('Processing...').addClass('blue-text');
  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: '/admin/addclaim',
    data: { idToken: theIdToken },
    success: function(data) {
      console.log('Admin claim added: ', data);
      $('#add-claim-result').text('Admin claim added').removeAttr('class').addClass('green-text');
      $('#add-claim-loader').hide();
      $('#add-claim').removeAttr('disabled');
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
    },
    error: function(xhr, status, error) {
      console.error('Something went wrong! ', JSON.stringify(status),' ' , JSON.stringify(error));
      $('#add-claim-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
      $('#add-claim-loader').hide();
      $('#add-claim').removeAttr('disabled');
    },
  });
});


$('#mark-fulfilled').on('click', function() {
  $('#mark-fulfilled').attr('disabled', 'disabled');
  $('#mark-fulfilled-loader').css('display', 'inline-block');
  $('#mark-fulfilled-progress').html('<div class="progress"><div class="determinate"></div></div>');
  $('#mark-fulfilled-result').text('Processing...').addClass('blue-text');
  var query;
  var d = new Date();
  var collectionName = 'requests';
  var oneWeekBack = new Date(d.setDate(d.getDate() - 7));
  var i = 0;
  var batch = db.batch();
  query = db.collection(collectionName).where('fulfilled', '==', 'false').where('datetime', '<', oneWeekBack);
  query.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      i++;
      console.log('Processing ' + doc.id + '...');
      batch.update(db.collection(collectionName).doc(doc.id), {'fulfilled': 'true'});
    });
  })
  .then(function(){
    batch.commit().then(function () {
    $('#mark-fulfilled-loader').hide();
    $('#mark-fulfilled').removeAttr('disabled');
    if(i === 0) {
        console.log('No records to process!');
        $('#mark-fulfilled-result').text('No records to process!').removeAttr('class').addClass('green-text');
      } else {
        console.log('Processed ' + i + ' records.');
        var pluralizer = '';
        if (i != 1) {
          pluralizer = 's';
        }
        $('#mark-fulfilled-result').text('Marked ' + i + ' record' + pluralizer + ' as fulfilled.').removeAttr('class').addClass('green-text');
      }
    });
  })
  .catch(function(error){
    console.error('Error: ', error);
    $('#mark-fulfilled-result').text('Something went wrong!').removeAttr('class').addClass('red-text');
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
    data: { idToken: theIdToken, token: theToken },
    success: function(data) {
      console.log(data);
      $('#token-details-result').text(JSON.stringify(data)).removeAttr('class').addClass('green-text');
      $('#token-details-loader').hide();
      $('#token-details').removeAttr('disabled');
      if(data.error) {
        $('#token-details-result').removeAttr('class').addClass('red-text');
      }
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
    data: { idToken: theIdToken, topic: theTopic, message: theMessage },
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
    method: 'POST',
    dataType: 'json',
    url: '/admin/listusers',
    data: { idToken: theIdToken },
    success: function(data) {
      var usersTable = '<table id="users" class="striped"><thead><tr>';
      usersTable += '<th>Name</th><th>Email</th><th>Avatar</th><th>Admin?</th><th>Signed Up</th><th>Last Login</th><th>Delete</th>';
      usersTable += '</tr></thead><tbody>';
      for (var user in data) {
        if(user) {
          usersTable += '<tr>';
          usersTable += '<td><img src="' + data[user].photoURL + '" width="25" alt="Avatar"></td>';
          usersTable += '<td>' + data[user].displayName + '</td>';
          usersTable += '<td>' + data[user].email + '</td>';
          if(data[user].customClaims && data[user].customClaims.admin) {
            usersTable += '<td>' + matIconCheck + '</td>';
          } else {
            usersTable += '<td>' + matIconClear + '</td>';
          }
          usersTable += '<td>' + humanDate(data[user].metadata.creationTime, true) + '</td>';
          usersTable += '<td>' + humanDate(data[user].metadata.lastSignInTime, true) + '</td>';
          usersTable += '<td><a class="delete" data-user="' + data[user].uid + '">' + matIconDelete + '</a></td>';
          usersTable += '</tr>';
        }
      }
      usersTable += '</tbody></table>';
      $('#list-users-result').html(usersTable).removeAttr('class');
      $('.delete').on('click', function(event) {
        event.preventDefault();
        var displayName = $($(event.target).parent().parent().find('td')[1]).text();
        if(confirm('Are you sure you want to delete the user "' + displayName + '"?')) {
          $(event.target).html(matIconRefresh).addClass('icon-spin');
          var uid = $(event.target).attr('data-user');
          $.ajax({
            method: 'POST',
            dataType: 'json',
            url: '/admin/deleteuser',
            data: { idToken: theIdToken, uid: uid },
            success: function(data) {
              console.log(data);
              $(event.target).parent().parent().addClass('deleted');
              setTimeout(function() { $(event.target).parent().parent().remove(); }, 1500);
            },
            error: function(xhr, status, error) {
              console.error('Something went wrong! ', status,' ', error);
              $(event.target).html(matIconDelete).removeClass('icon-spin');
            },
          });
        } else {
          console.log('Delete dialog dismissed');
        }
      });
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
