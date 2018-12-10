/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, firebase, topLoader, M, db, performLogin, authStatusUpdated */

var progressElement = '#form-spinner';
var collectionName = 'requests';

initializeSelects();


// Check and update necessary fields
if(authStatusUpdated) {
  if (firebase.auth().currentUser) {
    $('#mainForm #email').val(firebase.auth().currentUser.email);
    $('#mainForm #user').val(firebase.auth().getUid());
    $(progressElement).hide();
  }
} else {
  firebase.auth().onAuthStateChanged(function() {
    if (firebase.auth().currentUser) {
      $('#mainForm #email').val(firebase.auth().currentUser.email);
      $('#mainForm #user').val(firebase.auth().getUid());
    }
  });
  $(progressElement).hide();
}


// Add request to database
$('#addRequest').on('click', function(event) {
  if(!firebase.auth().currentUser) {
    event.preventDefault();
    $('#result').html('Please <a id="logineasy">Login</a> with a Google account.').addClass('red-text');
    $('#logineasy').on('click', function(event) {
      event.preventDefault();
      performLogin();
    });
  } else {
    if($('#mainForm')[0].checkValidity()) {
      event.preventDefault();
      if($('#group').val() != '' || $('#phone').val() != '' || $('#place').val() != '') {
        $('#addRequest').attr('disabled', 'disabled');
        $('#result').text('');
        $(progressElement).show();
        db.collection(collectionName).add({
          group: $('#group').val(),
          phone: $('#phone').val(),
          place: $('#place').val(),
          fulfilled: $('#fulfilled').val(),
          datetime: new Date(),
          email: $('#email').val(),
          user: $('#user').val()
        })
        .then(function(docRef) {
          $('#result').text('Record added!').addClass('green-text');
          $('#mainForm')[0].reset();
          $('#addDonor').removeAttr('disabled');
          $(progressElement).hide();
        })
        .catch(function(error) {
          $('#result').text('Error: Something went wrong!').addClass('red-text');
          $('#addDonor').removeAttr('disabled');
          $(progressElement).hide();
          console.error(error);
        });
      } else {
        $('#result').text('Please fill all details!').addClass('red-text');
      }
    }
  }
});


function initializeSelects() {
  var elems = document.querySelectorAll('select');
  var options = {};
  M.FormSelect.init(elems, options);
}


$(document).ready($(topLoader).hide());
