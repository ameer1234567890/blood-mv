/*jshint esversion: 6 */
/*globals $, firebase, topLoader, setKeyValueStore, getKeyValueStore, db, tableSearch, humanDate */

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
  if(loadMore) {
    if(includeFulfilled == true) {
      var query = db.collection(collectionName).limit(recordsPerPage).orderBy('datetime', 'desc').startAfter(lastVisible);
    } else {
      var query = db.collection(collectionName).where('fulfilled', '==', 'false').limit(recordsPerPage).orderBy('datetime', 'desc').startAfter(lastVisible);
    }
  } else {
    if(includeFulfilled == true) {
      var query = db.collection(collectionName).limit(recordsPerPage).orderBy('datetime', 'desc');
    } else {
      var query = db.collection(collectionName).where('fulfilled', '==', 'false').limit(recordsPerPage).orderBy('datetime', 'desc');
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
        toggleFullfillment(doc.id, isFulfilled);
      });
    });
    $(progressElement).hide();
    $(loadMoreElement).show();
    if(!lastVisible) {
      $(loadMoreElement).off();
      $(loadMoreElement + ' > a').addClass('disabled').html('<i class="material-icons right">more_horiz</i>End of the World');
    } else {
      $(loadMoreElement + ' > a').removeClass('disabled').html('<i class="material-icons right">expand_more</i>Load More');
      $(loadMoreElement).off().on('click', function() {
        loadBloodRequests(getKeyValueStore('includeFulfilled'), true);
      });
    }
  });
}


function toggleFullfillment(docId, isFulfilled) {
  $('#checkbox-' + docId).text('refresh').addClass('icon-spin');
  if(isFulfilled == 'true') {
    db.collection(collectionName).doc(docId).update({
      fulfilled: 'false'
    })
    .then(function(docRef) {
      $('#checkbox-' + docId).text('check_box_outline_blank').removeClass('icon-spin').attr('data-fulfilled', 'false');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).text('check_box').removeClass('icon-spin').attr('data-fulfilled', 'true');
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
      $('#checkbox-' + docId).text('check_box').removeClass('icon-spin').attr('data-fulfilled', 'true');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
    })
    .catch(function(error) {
      $('#checkbox-' + docId).text('check_box_outline_blank').removeClass('icon-spin').attr('data-fulfilled', 'false');
      $('#checkbox-' + docId).on('click', function(event) {
        isFulfilled = $('#checkbox-' + docId).attr('data-fulfilled');
        toggleFullfillment(docId, isFulfilled);
      });
      console.error(error);
    });
  }
}


$(document).ready($(topLoader).hide());
