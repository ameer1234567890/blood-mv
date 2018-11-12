/*jshint esversion: 6 */
/*globals $, firebase, db, provider, topLoader, authStatusUpdated */

var nonAdminMessage = '<div class="container"><br><br>Please login with an admin capable user!<br><br><br><br><br><br><br></div>';

$(document).ready(function() {
  if(authStatusUpdated) {
    firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
      if (!!idTokenResult.claims.admin) {
        console.log('You are admin');
      } else {
        console.log('You are not admin');
        $('#content').html(nonAdminMessage);
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
          } else {
            console.log('You are not admin');
            $('#content').html(nonAdminMessage);
          }
        })
        .catch((error) => {
          console.log(error);
        });
      } else {
        console.log('You are not admin');
        $('#content').html(nonAdminMessage);        
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
  $('#mark-fulfilled').attr('disabled', 'disabled').text('Processing Request Right Now.');
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
    $('#mark-fulfilled-result').text('Done processing ' + i + ' records.');
    $('#mark-fulfilled-loader').hide();
    $('#mark-fulfilled').removeAttr('disabled').text('Mark Old Requests as Fulfilled');
  });
});


$('#subscribe-token').on('click', function() {
  $('#subscribe-token').attr('disabled', 'disabled').text('Processing Your Request.');
  $('#subscribe-token-loader').css('display', 'inline-block');
  console.log($('#subscribe-token-token').val());

  //$('#subscribe-token-loader').hide();
  //$('#subscribe-token').removeAttr('disabled').text('Subscribe Token to Topic');
});


$(document).ready($(topLoader).hide());
