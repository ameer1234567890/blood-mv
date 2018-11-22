/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, firebase, topLoader, authStatusUpdated, M, db, htmlDate, performLogin, matIconEdit */

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
  } else {
    firebase.auth().onAuthStateChanged(function() {
      atollsInstance.destroy();
      islandsInstance.destroy();
      loadExistingData();
      initializeSelects();
    });
  }
});


// Load existing data if available
function loadExistingData() {
  if (firebase.auth().currentUser) {
    $('#mainForm #email').val(firebase.auth().currentUser.email);
    $('#mainForm #user').val(firebase.auth().getUid());
    if(localStorage.getItem('donorId') && localStorage.getItem('donorId') != 'none') {
      db.collection('donors').doc(localStorage.getItem('donorId')).get().then((doc) => {
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
        $('#addDonor').html('Update Record' + matIconEdit);
        $('#mainForm #first').focus().blur();
        $(progressElement).hide();
      });
    } else if(!localStorage.getItem('donorId')) {
      db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          $('#nav-d-add > a').text('Edit my details');
          $('#nav-m-add > a').html(matIconEdit + 'Edit my details');
          localStorage.setItem('donorId', doc.id);
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
          $('#addDonor').html('Update Record' + matIconEdit);
          $('#mainForm #first').focus().blur();
          $(progressElement).hide();
        });
      });
    } else {
      $(progressElement).hide();
    }
  } else {
    $(progressElement).hide();
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
    $('#result').html('Please <a id="logineasy">Login</a> with a Google account.');
    $('#result').addClass('red-text');
    $('#logineasy').on('click', function(event) {
      event.preventDefault();
      performLogin();
    });
  } else {
    if($('#mainForm')[0].checkValidity()) {
      event.preventDefault();
      if($('#first').val() != '' || $('#last').val() != '' || $('#gender').val() != '' || $('#born').val() != '' || $('#group').val() != ''||
         $('#atoll').val() != '' || $('#island').val() != '' || $('#donated').val() != '' || $('#phone').val() != '') {
        $('#addDonor').attr('disabled', 'disabled');
        $(progressElement).show();
        $('#result').text('');
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
            $('#result').text('Record added!');
            $('#result').addClass('green-text');
            $('#mainForm')[0].reset();
            $('#addDonor').removeAttr('disabled');
            $(progressElement).hide();
          })
          .catch(function(error) {
            $('#result').text('Error: Something went wrong!');
            $('#result').addClass('red-text');
            $(progressElement).hide();
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
            $('#result').text('Record updated!');
            $('#result').addClass('green-text');
            $('#mainForm')[0].reset();
            $('#addDonor').removeAttr('disabled');
            $(progressElement).hide();
          })
          .catch(function(error) {
            $('#result').text('Error: Something went wrong!');
            $('#result').addClass('red-text');
            $('#addDonor').removeAttr('disabled');
            $(progressElement).hide();
            console.error(error);
          });
        }
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
  M.FormSelect.init(elems, options);
}
  

function initializePickers() {
  var elems = document.querySelectorAll('.datepicker');
  var options = { 'format': 'yyyy-mm-dd'};
  M.Datepicker.init(elems, options);
}


$(document).ready($(topLoader).hide());
