/*jshint esversion: 6 */
/*globals $, firebase, Waves, Sidenav */

// Initialize waves animation library
Waves.init();

// Create firebase database reference
var db = firebase.firestore();
db.settings({timestampsInSnapshots: true});
var isNewUser = true;
var theDocId;

// Enable offline database caching
firebase.firestore().enablePersistence({experimentalTabSynchronization:true}).catch(function(err) { console.error(err); });

// Initialize the spinner
if($('#listPage')[0]) {
  $('#spinner').show();
}


// Add donor details to database
$('#addDonor').on('click', function(event) {
  if(!firebase.auth().currentUser) {
    event.preventDefault();
    $('#spinner').hide();
    $('#result').html('Please <a id="logineasy" href=".">Login</a> with a Google account.');
    $('#result').addClass('text-danger');
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
            $('#result').addClass('text-success');
            $('#mainForm')[0].reset();
          })
          .catch(function(error) {
            $('#spinner').hide();
            $('#result').text('Error: Something went wrong!');
            $('#result').addClass('text-danger');
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
            $('#result').addClass('text-success');
            $('#mainForm')[0].reset();
          })
          .catch(function(error) {
            $('#spinner').hide();
            $('#result').text('Error: Something went wrong!');
            $('#result').addClass('text-danger');
            console.error(error);
          });
        }
        $('#addDonor').removeAttr('disabled');
      } else {
        $('#result').text('Please fill all details!');
        $('#result').addClass('text-danger');
      }
    }
  }
});


// Add request to database
$('#addRequest').on('click', function(event) {
  if(!firebase.auth().currentUser) {
    event.preventDefault();
    $('#spinner').hide();
    $('#result').html('Please <a id="logineasy" href=".">Login</a> with a Google account.');
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
          $('#result').addClass('text-success');
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
      }
    }
  }
});


// Load list of atolls
if($('#addPage')[0]) {
  $.getJSON('atolls.min.json', function(data) {
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


// Reload list of donors / requests when toggle is clicked
$('.display-toggle').on('click', function(event) {
  if($('#reqListPage')[0]) {
    if($('.display-toggle i').text() == 'check_box') {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      $('#spinner').show();
      $('#requests').DataTable().destroy();
      $('#requests').find('tr:gt(0)').remove();
      setCookie('inclfulf', 'false', 30);
      LoadBloodRequests(false);
    } else {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      $('#spinner').show();
      $('#requests').DataTable().destroy();
      $('#requests').find('tr:gt(0)').remove();
      setCookie('inclfulf', 'true', 30);
      LoadBloodRequests(true);
    }
  } else if ($('#listPage')[0]) {
    if($('.display-toggle i').text() == 'check_box') {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      $('#spinner').show();
      $('#donors').DataTable().destroy();
      $('#donors').find('tr:gt(0)').remove();
      setCookie('inclundonatables', 'false', 30);
      LoadBloodDonors(false);
    } else {
      $('.display-toggle i').text('refresh').addClass('icon-spin');
      $('#spinner').show();
      $('#donors').DataTable().destroy();
      $('#donors').find('tr:gt(0)').remove();
      setCookie('inclundonatables', 'true', 30);
      LoadBloodDonors(true);
    }
  }
});


function loadIslands(value) {
  $('#island').empty()
              .append('<option value="" disabled selected hidden>Select island / ward</option>');
  $.getJSON('islands.min.json', function(data) {
    var $select = $('#island');
    $.each(data, function(index, o) {
      if (o.letter == value) {
        var $option = $('<option/>').attr('value', o.name).text(o.name);
        $select.append($option);
      }
    });
  });
}


$('#atoll').on('change', function(event) {
  loadIslands($(this).find(':selected').data('letter'));
});


// Load donors table
if($('#listPage')[0]) {
  if(!getCookie('inclundonatables')) {
    setCookie('inclundonatables', 'true', 30);
  }
  if(getCookie('inclundonatables') == 'true') {
    LoadBloodDonors(true);
  } else {
    LoadBloodDonors(false);
  }
}


function LoadBloodDonors(includeUndonatables) {
  if(includeUndonatables == true) {
    db.collection('donors').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $('#donors').find('tbody').append($('<tr>')
          .append($('<td scope="row">').text(doc.data().first + ' ' + doc.data().last))
          .append($('<td>').text(doc.data().gender))
          .append($('<td>').text(age(doc.data().born.toDate())))
          .append($('<td>').text(doc.data().group))
          .append($('<td>').text(doc.data().atoll))
          .append($('<td>').text(doc.data().island))
          .append($('<td>').text(doc.data().phone))
          .append($('<td>').text(humanDate(doc.data().donated.toDate(), false)))
        );
      });
      $('#spinner').hide();
      $('.display-toggle i').text('check_box_outline_blank').removeClass('icon-spin');
      $('#donors').DataTable();
    });
  } else {
    var d = new Date();
    var threeMonthsBack = new Date(d.setMonth(d.getMonth() - 3));
    db.collection('donors').where('donated', '<', threeMonthsBack).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $('#donors').find('tbody').append($('<tr>')
          .append($('<td scope="row">').text(doc.data().first + ' ' + doc.data().last))
          .append($('<td>').text(doc.data().gender))
          .append($('<td>').text(age(doc.data().born.toDate())))
          .append($('<td>').text(doc.data().group))
          .append($('<td>').text(doc.data().atoll))
          .append($('<td>').text(doc.data().island))
          .append($('<td>').text(doc.data().phone))
          .append($('<td>').text(humanDate(doc.data().donated.toDate(), false)))
        );
      });
      $('#spinner').hide();
      $('.display-toggle i').text('check_box_outline_blank').removeClass('icon-spin');
      $('#donors').DataTable();
    });    
  }
}


// Load requests table
if($('#reqListPage')[0]) {
  if(!getCookie('inclfulf')) {
    setCookie('inclfulf', 'false', 30);
  }
  if(getCookie('inclfulf') == 'true') {
    LoadBloodRequests(true);
  } else {
    LoadBloodRequests(false);
  }
}


function LoadBloodRequests(includeFulfilled) {
  if(includeFulfilled == true) {
    db.collection('requests').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $('#requests').find('tbody').append($('<tr>')
          .append($('<td scope="row">').text(doc.data().group))
          .append($('<td>').text(doc.data().phone))
          .append($('<td>').text(doc.data().place))
          .append($('<td>').text(humanDate(doc.data().datetime.toDate(), true)))
          .append($('<td>').html('' +
                                 (doc.data().user == firebase.auth().getUid() ?
                                   '<i class="material-icons fulf-enabled" id="checkbox-' + doc.id + '" data-fulfilled="' + doc.data().fulfilled + '">' :
                                   '<i class="material-icons fulf-disabled">') +
                                 '' +
                                 (doc.data().fulfilled == 'true' ?
                                   'check_box</i>' :
                                   'check_box_outline_blank</i>') +
                                 ''))
        );
        $('#checkbox-' + doc.id).on('click', function(event) {
          var isFulfilled = $('#checkbox-' + doc.id).attr('data-fulfilled');
          ToggleFullfillment(doc.id, isFulfilled);
        });
      });
      $('#spinner').hide();
      $('.display-toggle i').text('check_box_outline_blank').removeClass('icon-spin');
      $('#requests').DataTable({ "order": [[ 4, "desc" ], [ 3, "asc" ]] });
    });
  } else {
    db.collection('requests').where('fulfilled', '==', 'false').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $('#requests').find('tbody').append($('<tr>')
          .append($('<td scope="row">').text(doc.data().group))
          .append($('<td>').text(doc.data().phone))
          .append($('<td>').text(doc.data().place))
          .append($('<td>').text(humanDate(doc.data().datetime.toDate(), true)))
          .append($('<td>').html('' +
                                 (doc.data().user == firebase.auth().getUid() ?
                                   '<i class="material-icons fulf-enabled" id="checkbox-' + doc.id + '" data-fulfilled="' + doc.data().fulfilled + '">' :
                                   '<i class="material-icons fulf-disabled">') +
                                 '' +
                                 (doc.data().fulfilled == 'true' ?
                                   'check_box</i>' :
                                   'check_box_outline_blank</i>') + 
                                 ''))
        );
        $('#checkbox-' + doc.id).on('click', function(event) {
          var isFulfilled = $('#checkbox-' + doc.id).attr('data-fulfilled');
          ToggleFullfillment(doc.id, isFulfilled);
        });
      });
      $('#spinner').hide();
      $('.display-toggle i').text('check_box_outline_blank').removeClass('icon-spin');
      $('#requests').DataTable({ "order": [[ 4, "desc" ], [ 3, "asc" ]] });
    });
  }
}


function ToggleFullfillment(docId, isFulfilled) {
  $('#checkbox-' + docId).replaceWith('<i class="material-icons icon-spin" id="checkbox-' + docId + '">refresh</i>');
  if(isFulfilled == 'true') {
    db.collection('requests').doc(docId).update({
      fulfilled: 'false'
    })
    .then(function(docRef) {
      $('#checkbox-' + docId).replaceWith('<i class="material-icons fulf-enabled" id="checkbox-' + docId + '" data-fulfilled="false">check_box_outline_blank</i>');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        ToggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).replaceWith('<i class="material-icons fulf-enabled" id="checkbox-' + docId + '" data-fulfilled="true">check_box</i>');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        ToggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  } else {
    db.collection('requests').doc(docId).update({
      fulfilled: 'true'
    })
    .then(function(docRef) {
      $('#checkbox-' + docId).replaceWith('<i class="material-icons fulf-enabled" id="checkbox-' + docId + '" data-fulfilled="true">check_box</i>');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        ToggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).replaceWith('<i class="material-icons fulf-enabled" id="checkbox-' + docId + '" data-fulfilled="false">check_box_outline_blank</i>');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        ToggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  }
}


function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}


function age(dob) {
  dob = new Date(dob);
  var today = new Date();
  var age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
  return age;
}


function humanDate(date, returnTime) {
  date = new Date(date);
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if(returnTime == true) {
    return ('0' + date.getDate()).slice(-2) +
           '-' + monthNames[date.getMonth()] +
           '-' + date.getFullYear() +
           ' '  + ('0' + date.getHours()).slice(-2) +
           ':' + ('0' + date.getMinutes()).slice(-2);
  } else {
    return ('0' + date.getDate()).slice(-2) +
           '-' + monthNames[date.getMonth()] +
           '-' + date.getFullYear();
  }
}


function htmlDate(date, returnTime) {
  date = new Date(date);
  var monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '1', '12'];
  if(returnTime == true) {
    return date.getFullYear() +
           '-' + monthNames[date.getMonth()] +
           '-' + ('0' + date.getDate()).slice(-2) +
           ' '  + ('0' + date.getHours()).slice(-2) +
           ':' + ('0' + date.getMinutes()).slice(-2);
  } else {
    return date.getFullYear() +
           '-' + monthNames[date.getMonth()] +
           '-' + ('0' + date.getDate()).slice(-2);
  }
}


// Initialize Google Auth Provider
var provider = new firebase.auth.GoogleAuthProvider();


$('.btn-login').on('click', function(event) {
  event.preventDefault();
  performLogin();
});


function performLogin() {
  firebase.auth().signInWithRedirect(provider).then(function(result) {
    console.log(result.user);
  }).catch(function(error) {
    console.error(error);
  });
}


function performLogout() {
  firebase.auth().signOut().then(function() {
    $('#nav-req-add').remove();
    $('#nav-add').remove();
    console.log('Signout Succesfull');
  }, function(error) {
    console.error('Signout Failed');
    console.error(error);
  });
}


firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $('#display-name').html(user.displayName);
    $('.avatar').replaceWith('<img src="' + user.photoURL + '" class="avatar-img" alt="Avatar" width="100" height="100">');
    db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        isNewUser = false;
        if($('#addPage')[0]) {
          $('#nav-links').append($('<li id="nav-add" class="active waves-effect"><a href="/add/"><i class="material-icons">edit</i>Edit my details</a></li>'));
        } else {
          $('#nav-links').append($('<li id="nav-add" class="waves-effect"><a href="/add/"><i class="material-icons">edit</i>Edit my details</a></li>'));
        }
      });
    })
    .then(function(docRef) {
      if(isNewUser == true) {
        if($('#addPage')[0]) {
          $('#nav-links').append($('<li id="nav-add" class="active waves-effect"><a href="/add/"><i class="material-icons">add</i>Add me as a donor</a></li>'));
        } else {
          $('#nav-links').append($('<li id="nav-add" class="waves-effect"><a href="/add/"><i class="material-icons">add</i>Add me as a donor</a></li>'));
        }
      }
      // Remove element and re-add, to move it to last
      $('#nav-log').remove();
      $('#nav-links').append($('<li id="nav-log" class="waves-effect"><a href=""><i class="material-icons">exit_to_app</i>Logout</a></li>'));
      $('#nav-log').on('click', function(event) {
        event.preventDefault();
        performLogout();
      });
    });
    if($('#reqAddPage')[0]) {
      $('#nav-links').append($('<li id="nav-req-add" class="active waves-effect"><a href="/request/add/"><i class="material-icons">local_hospital</i>Request for Blood</a></li>'));
    } else {
      $('#nav-links').append($('<li id="nav-req-add" class="waves-effect"><a href="/request/add/"><i class="material-icons">local_hospital</i>Request for Blood</a></li>'));
    }
    if($('#addPage')[0]) {
      $('#mainForm #email').val(firebase.auth().currentUser.email);
      $('#mainForm #user').val(firebase.auth().getUid());
      // Load existing data if found
      db.collection('donors').where('user', '==', firebase.auth().getUid()).limit(1).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          theDocId = doc.id;
          $('#addDonor').text('Update Record');
          $('#mainForm #first').val(doc.data().first);
          $('#mainForm #last').val(doc.data().last);
          $('#mainForm #gender').val(doc.data().gender);
          $('#mainForm #born').val(htmlDate(doc.data().born.toDate(), false));
          $('#mainForm #group').val(doc.data().group);
          $('#mainForm #atoll').val(doc.data().atoll);
          $.when(loadIslands($('#mainForm #atoll').find(':selected').data('letter'))).done(function(){
            $('#island').append($('<option/>').attr('value', doc.data().island).text(doc.data().island)); // This is just a temporary hack
            $('#mainForm #island').val(doc.data().island);
          });
          $('#mainForm #phone').val(doc.data().phone);
          $('#mainForm #donated').val(htmlDate(doc.data().donated.toDate(), false));
        });
      })
      .then(function(docRef) {
        $('#spinner').hide();
      });
    }
    if($('#reqAddPage')[0]) {
      $('#mainForm #email').val(firebase.auth().currentUser.email);
      $('#mainForm #user').val(firebase.auth().getUid());
      $('#spinner').hide();
    }
  } else {
    $('.headline').html('Please login to add / edit your details');
    $('#display-name').html('Not Logged in');
    $('#nav-log').replaceWith('<li id="nav-log" class="waves-effect"><a href=""><i class="material-icons">exit_to_app</i>Login</a></li>');
    $('#nav-log').on('click', function(event) {
      event.preventDefault();
      performLogin();
    });
  }
});


var sidenav = new Sidenav({
  content: document.getElementById('content'),
  sidenav: document.getElementById('sidenav'),
  backdrop: document.getElementById('backdrop')
});


document.getElementById('menu-toggle').addEventListener('click', function() {
  if(sidenav.isOpened) {
    sidenav.close();
  } else {
    sidenav.open();
  }
});


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function() {
    console.log('[Service Worker] Service worker is all cool.');
  }).catch(function(e) {
    console.error('[Service Worker] Service worker is not so cool.', e);
    throw e;
  });
}
