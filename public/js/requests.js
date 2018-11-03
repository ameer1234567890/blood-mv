/*jshint esversion: 6 */
/*globals $, firebase, topLoader, setKeyValueStore, getKeyValueStore, db, tableSearch, humanDate,
  matIconCheckBox, matIconCheckBoxOutline, matIconMoreHoriz, matIconExpandMore, matIconRefresh */

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
  query.get().then((querySnapshot) => {
    lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
    querySnapshot.forEach((doc) => {
      $('#requests tbody').append($('<tr>')
        .append($('<td scope="row">').text(doc.data().group))
        .append($('<td>').text(doc.data().phone))
        .append($('<td>').text(doc.data().place))
        .append($('<td>').text(humanDate(doc.data().datetime.toDate(), true)))
      );
      if(doc.data().user == firebase.auth().getUid()) {
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
      $('#checkbox-' + docId).html(matIconCheckBoxOutline).removeClass('icon-spin').attr('data-fulfilled', 'false');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).html(matIconCheckBox).removeClass('icon-spin').attr('data-fulfilled', 'true');
      $('#checkbox-' + docId).on('click', function(event) {
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
      $('#checkbox-' + docId).html(matIconCheckBox).removeClass('icon-spin').attr('data-fulfilled', 'true');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).html(matIconCheckBoxOutline).removeClass('icon-spin').attr('data-fulfilled', 'false');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  }
}


$(document).ready($(topLoader).hide());
