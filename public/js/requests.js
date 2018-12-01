/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, firebase, topLoader, setKeyValueStore, getKeyValueStore, db, tableSearch, humanDate, isAdmin,
   matIconCheckBox, matIconCheckBoxOutline, matIconMoreHoriz, matIconExpandMore, matIconRefresh, matIconDelete, matIconShare */

var progressElement = '#table-spinner';
var loadMoreElement = '.load-more';
var collectionName = 'requests';
var recordsPerPage = 10;
var lastVisible;

// Search the table when something is entered in search box
$('#search').on('keyup', function(event) {
  var searchElement = document.getElementById('search');
  var tableElement = document.getElementById('requests');
  tableSearch(searchElement, tableElement);
});


// Reload list of requests when toggle is clicked
$('#display-toggle').on('click', function(event) {
  if($('#display-toggle').prop('checked')) {
    $(progressElement).show();
    $('#requests').find('tr:gt(0)').remove();
    setKeyValueStore('includeFulfilled', true);
    loadBloodRequests(true);
  } else {
    $(progressElement).show();
    $('#requests').find('tr:gt(0)').remove();
    setKeyValueStore('includeFulfilled', false);
    loadBloodRequests(false);
  }
});


// Load requests table
if(getKeyValueStore('includeFulfilled')) {
  $('#display-toggle').prop('checked', 'checked');
  loadBloodRequests(true);
} else {
  $('#display-toggle').prop('checked', '');
  loadBloodRequests(false);
}


// Click handlers for pagination
$(loadMoreElement).on('click', function() {
  loadBloodRequests(getKeyValueStore('includeFulfilled'), true);
});


function loadBloodRequests(includeFulfilled, loadMore) {
  $(loadMoreElement).off();
  var query;
  if(loadMore) {
    if(includeFulfilled) {
      query = db.collection(collectionName).limit(recordsPerPage).orderBy('datetime', 'desc').startAfter(lastVisible);
    } else {
      query = db.collection(collectionName).where('fulfilled', '==', 'false').limit(recordsPerPage).orderBy('datetime', 'desc').startAfter(lastVisible);
    }
  } else {
    if(includeFulfilled) {
      query = db.collection(collectionName).limit(recordsPerPage).orderBy('datetime', 'desc');
    } else {
      query = db.collection(collectionName).where('fulfilled', '==', 'false').limit(recordsPerPage).orderBy('datetime', 'desc');
    }    
  }
  var i = 0;
  query.get().then((querySnapshot) => {
    lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
    querySnapshot.forEach((doc) => {
      $('#requests tbody').append($('<tr>')
        .append($('<td scope="row">').text(doc.data().group))
        .append($('<td>').text(doc.data().phone))
        .append($('<td>').text(doc.data().place))
        .append($('<td>').text(humanDate(doc.data().datetime.toDate(), true)))
      );
      if(doc.data().user == firebase.auth().getUid() || isAdmin) {
        if(doc.data().fulfilled == 'true') {
          $('#requests tbody tr:last-child').append($('<td>').html('<span class="fulf-enabled" id="checkbox-' + doc.id + '" data-fulfilled="' + doc.data().fulfilled + '">' + matIconCheckBox + '</span>'));
        } else {
          $('#requests tbody tr:last-child').append($('<td>').html('<span class="fulf-enabled" id="checkbox-' + doc.id + '" data-fulfilled="' + doc.data().fulfilled + '">' + matIconCheckBoxOutline + '</span>'));
        }
      } else {
        if(doc.data().fulfilled == 'true') {
          $('#requests tbody tr:last-child').append($('<td>').html('<span class="fulf-disabled">' + matIconCheckBox + '</span>'));
        } else {
          $('#requests tbody tr:last-child').append($('<td>').html('<span class="fulf-disabled">' + matIconCheckBoxOutline + '</span>'));
        }
      }
      if(doc.data().fulfilled == 'false') {
        $('#requests tbody tr:last-child').append($('<td>').html('<a class="share-link" id="share-' + doc.id + '">' + matIconShare + '</a>'));
        $('#share-' + doc.id).on('click', function(event) {
          shareRequest(doc.data().group, doc.data().place, doc.data().phone);
        });
      } else {
        $('#requests tbody tr:last-child').append($('<td>').html('&nbsp;'));
      }
      if(isAdmin) {
        i++;
        if(i == 1) {
          $('#requests thead tr:last-child').append($('<th>').html('Delete'));
        }
        $('#requests tbody tr:last-child').append($('<td>').html('<span class="delete" id="delete-' + doc.id + '">' + matIconDelete + '</span>'));
        $('#delete-' + doc.id).on('click', function(event) {
          $('#delete-' + doc.id).html(matIconRefresh).addClass('icon-spin');
          deleteRequest(doc.id);
        });
      }
      $('#checkbox-' + doc.id).on('click', function(event) {
        var isFulfilled = $('#checkbox-' + doc.id).attr('data-fulfilled');
        toggleFullfillment(doc.id, isFulfilled);
      });
    });
    $(progressElement).hide();
    $(loadMoreElement).show();
    if(!lastVisible) {
      $(loadMoreElement).off();
      $(loadMoreElement + ' > a').addClass('disabled').html(matIconMoreHoriz + 'End of the World' + matIconMoreHoriz);
    } else {
      $(loadMoreElement + ' > a').removeClass('disabled').html('Load More' + matIconExpandMore);
      $(loadMoreElement).off().on('click', function() {
        loadBloodRequests(getKeyValueStore('includeFulfilled'), true);
      });
    }
  });
}


function toggleFullfillment(docId, isFulfilled) {
  $('#checkbox-' + docId).html(matIconRefresh).addClass('icon-spin');
  if(isFulfilled == 'true') {
    db.collection(collectionName).doc(docId).update({
      fulfilled: 'false'
    })
    .then(function(docRef) {
      $('#checkbox-' + docId).html(matIconCheckBoxOutline).removeClass('icon-spin').attr('data-fulfilled', 'false').on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).html(matIconCheckBox).removeClass('icon-spin').attr('data-fulfilled', 'true').on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  } else {
    db.collection(collectionName).doc(docId).update({
      fulfilled: 'true'
    })
    .then(function(docRef) {
      $('#checkbox-' + docId).html(matIconCheckBox).removeClass('icon-spin').attr('data-fulfilled', 'true').on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).html(matIconCheckBoxOutline).removeClass('icon-spin').attr('data-fulfilled', 'false').on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  }
}


function deleteRequest(docId) {
  if(confirm('Are you sure you want to delete the request "' + docId + '"?')) {
    db.collection(collectionName).doc(docId).delete()
    .then(function(docRef) {
      $('#delete-' + docId).parent().parent().addClass('deleted').fadeOut();
    })
    .catch(function(error) {
      $('#delete-' + docId).html(matIconDelete).removeClass('icon-spin');
      console.error(error);
    });
  } else {
    $('#delete-' + docId).html(matIconDelete).removeClass('icon-spin');
    console.log('Delete dialog dismissed');
  }
}


function shareRequest(group, place, phone) {
  if (navigator.share) {
    var title = 'Blood MV';
    var text = group + ' requested at ' + place + '. Contact ' + phone + ' (via Blood MV)';
    navigator.share({
      title: title,
      text: text
    })
    .then(() => {
      console.log('Successful share');
    })
    .catch((error) => {
      console.error('Error sharing:', error);
    });
  } else {
    M.toast({
      html: 'Sharing is not supported by this browser!',
      displayLength: 5000
    });
    console.warn('Web Share API not supported.');
  }
}


$(document).ready($(topLoader).hide());
