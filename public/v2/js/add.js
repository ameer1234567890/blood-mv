/*jshint esversion: 6 */
/*globals $, firebase, topLoader, authStatusUpdated */

var progressElement = '#form-spinner';
var theDocId;
var isNewUser = true;

// Initialize selects and date pickers
loadAtolls();
initializeSelects();
initializePickers();
var atollsInstance = M.FormSelect.getInstance(document.querySelectorAll('select')[2]);
var islandsInstance = M.FormSelect.getInstance(document.querySelectorAll('select')[3]);


$(document).ready(function() {
  if(authStatusUpdated) {
    atollsInstance.destroy();
    islandsInstance.destroy();
    loadExistingData();
    initializeSelects();
    $(progressElement).hide();
  } else {
    firebase.auth().onAuthStateChanged(function() {
      atollsInstance.destroy();
      islandsInstance.destroy();
      loadExistingData();
      initializeSelects();
      $(progressElement).hide();
    });
  }
});


// Load existing data if available
function loadExistingData() {
  if (firebase.auth().currentUser) {
    $('#mainForm #email').val(firebase.auth().currentUser.email);
    $('#mainForm #user').val(firebase.auth().getUid());
    db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        theDocId = doc.id;
        isNewUser = false;
        $('#mainForm #first').val(doc.data().first).focus();
        $('#mainForm #last').val(doc.data().last).focus();
        $('#mainForm #gender').val(doc.data().gender);
        $('#mainForm #born').val(htmlDate(doc.data().born.toDate(), false)).focus();
        $('#mainForm #group').val(doc.data().group);
        $('#mainForm #atoll').val(doc.data().atoll);
        $.when(loadIslands($('#mainForm #atoll').find(':selected').data('letter'))).done(function(){
          $('#island').append($('<option/>').attr('value', doc.data().island).text(doc.data().island)); // This is just a temporary hack
          $('#mainForm #island').val(doc.data().island);
        });
        $('#mainForm #phone').val(doc.data().phone).focus();
        $('#mainForm #donated').val(htmlDate(doc.data().donated.toDate(), false)).focus();
        $('#addDonor').html('Update Record<i class="material-icons right">edit</i>');
        $('#mainForm #first').focus().blur();
      });
    });
  }
}


// Load list of islands
function loadIslands(value) {
  var islandsInstance = M.FormSelect.getInstance(document.querySelectorAll('select')[3]);
  islandsInstance.destroy();
  $('#island').empty()
              .append('<option value="" disabled selected hidden>Select island / ward</option>');
  $.getJSON('/add/islands.min.json', function(data) {
    var $select = $('#island');
    $.each(data, function(index, o) {
      if (o.letter == value) {
        var $option = $('<option/>').attr('value', o.name).text(o.name);
        $select.append($option);
      }
    });
    initializeSelects();
  });
}

// Load list of atolls
function loadAtolls() {
  $.getJSON('/add/atolls.min.json', function(data) {
    var $select = $('#atoll');
    $.each(data, function(index, o) {
      var $option = $('<option/>')
                        .attr('value', o.name)
                        .attr('data-letter', o.letter)
                        .text(o.name);
      $select.append($option);
    });
  });
}


// Load island names when atoll field is changed
$('#atoll').on('change', function(event) {
  loadIslands($(this).find(':selected').data('letter'));
});


// Add donor details to database
$('#addDonor').on('click', function(event) {
  if(!firebase.auth().currentUser) {
    event.preventDefault();
    $('#spinner').hide();
    $('#result').html('Please <a id="logineasy">Login</a> with a Google account.');
    $('#result').addClass('red-text');
    $('#logineasy').on('click', function(event) {
      event.preventDefault();
      performLogin();
    });
  } else {
    if($('#mainForm')[0].checkValidity()) {
      event.preventDefault();
      if($('#first').val() != '' ||
         $('#last').val() != '' ||
         $('#gender').val() != '' ||
         $('#born').val() != '' ||
         $('#group').val() != '' ||
         $('#atoll').val() != '' ||
         $('#island').val() != '' ||
         $('#donated').val() != '' ||
         $('#phone').val() != '') {
        $('#addDonor').attr('disabled', 'disabled');
        $('#result').text('');
        $('#spinner').show();
        if(isNewUser == true) {
          db.collection('donors').add({
            first: $('#first').val(),
            last: $('#last').val(),
            gender: $('#gender').val(),
            born: new Date($('#born').val()),
            group: $('#group').val(),
            atoll: $('#atoll').val(),
            island: $('#island').val(),
            phone: $('#phone').val(),
            donated: new Date($('#donated').val()),
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
            $('#result').addClass('red-text');
            console.error(error);
          });
        } else {
          db.collection('donors').doc(theDocId).update({
            first: $('#first').val(),
            last: $('#last').val(),
            gender: $('#gender').val(),
            born: new Date($('#born').val()),
            group: $('#group').val(),
            atoll: $('#atoll').val(),
            island: $('#island').val(),
            phone: $('#phone').val(),
            donated: new Date($('#donated').val()),
            email: $('#email').val(),
            user: $('#user').val()
          })
          .then(function(docRef) {
            $('#spinner').hide();
            $('#result').text('Record updated!');
            $('#result').addClass('green-text');
            $('#mainForm')[0].reset();
          })
          .catch(function(error) {
            $('#spinner').hide();
            $('#result').text('Error: Something went wrong!');
            $('#result').addClass('red-text');
            console.error(error);
          });
        }
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
  

function initializePickers() {
  var elems = document.querySelectorAll('.datepicker');
  var options = { 'format': 'yyyy-mm-dd'};
  var instances = M.Datepicker.init(elems, options);
}


$(document).ready($(topLoader).hide());
