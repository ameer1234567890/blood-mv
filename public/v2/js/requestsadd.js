/*jshint esversion: 6 */
/*globals $, firebase, topLoader */

var progressElement = '#form-spinner';

initializeSelects();

$(document).ready(function() {
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
        $(progressElement).hide();
      }
    });
  }
});


// Add request to database
$('#addRequest').on('click', function(event) {
  if(!firebase.auth().currentUser) {
    event.preventDefault();
    $('#spinner').hide();
    $('#result').html('Please <a id="logineasy">Login</a> with a Google account.');
    $('#logineasy').on('click', function(event) {
      event.preventDefault();
      performLogin();
    });
  } else {
    if($('#mainForm')[0].checkValidity()) {
      event.preventDefault();
      if($('#group').val() != '' ||
         $('#phone').val() != '' ||
         $('#place').val() != '') {
        $('#addRequest').attr('disabled', 'disabled');
        $('#result').text('');
        $('#spinner').show();
        db.collection('requests').add({
          group: $('#group').val(),
          phone: $('#phone').val(),
          place: $('#place').val(),
          fulfilled: $('#fulfilled').val(),
          datetime: new Date(),
          email: $('#email').val(),
          user: $('#user').val()
        })
        .then(function(docRef) {
          $('#spinner').hide();
          $('#result').text('Record added!');
          $('#result').addClass('green-text');
          $('#mainForm')[0].reset();
        })
        .catch(function(error) {
          $('#spinner').hide();
          $('#result').text('Error: Something went wrong!');
          console.error(error);
        });
        $('#addDonor').removeAttr('disabled');
      } else {
        $('#result').text('Please fill all details!');
         $('#result').addClass('red-text');
      }
    }
  }
});


function initializeSelects() {
  var elems = document.querySelectorAll('select');
  var options = {};
  var instances = M.FormSelect.init(elems, options);
}


$(document).ready($(topLoader).hide());
