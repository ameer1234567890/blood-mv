/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, tableSearch, setKeyValueStore, getKeyValueStore, age, humanDate, db, topLoader, matIconMoreHoriz, matIconExpandMore */

var progressElement = '#table-spinner';
var loadMoreElement = '.load-more';
var collectionName = 'donors';
var recordsPerPage = 10;
var lastVisible;


// Search the table when something is entered in search box
$('#search').on('keyup', function(event) {
  var searchElement = document.getElementById('search');
  var tableElement = document.getElementById('donors');
  tableSearch(searchElement, tableElement);
});


// Reload list of donors when toggle is clicked
$('#display-toggle').on('click', function(event) {
  if($('#display-toggle').prop('checked')) {
    $(progressElement).show();
    $('#donors').find('tr:gt(0)').remove();
    setKeyValueStore('includeOnlyDonatable', false);
    loadBloodDonors(false);
  } else {
    $(progressElement).show();
    $('#donors').find('tr:gt(0)').remove();
    setKeyValueStore('includeOnlyDonatable', true);
    loadBloodDonors(true);
  }
});


// Load donors table
$(document).ready(function() {
  if(getKeyValueStore('includeOnlyDonatable')) {
    $('#display-toggle').prop('checked', '');
    loadBloodDonors(true);
  } else {
    $('#display-toggle').prop('checked', 'checked');
    loadBloodDonors(false);
  }
});


// Click handlers for pagination
$(loadMoreElement).on('click', function() {
  loadBloodDonors(getKeyValueStore('includeOnlyDonatable'), true);
});


function loadBloodDonors(includeOnlyDonatable, loadMore) {
  $(loadMoreElement).off();
  var query;
  var d = new Date();
  var threeMonthsBack = new Date(d.setMonth(d.getMonth() - 3));
  if(loadMore) {
    if(includeOnlyDonatable) {
      query = db.collection(collectionName).where('donated', '<', threeMonthsBack).limit(recordsPerPage).startAfter(lastVisible);
    } else {
      query = db.collection(collectionName).limit(recordsPerPage).startAfter(lastVisible);
    }
  } else {
    if(isAdmin) {
      $('#donors thead tr:last-child').append($('<th>').html('Delete'));
    }
    if(includeOnlyDonatable) {
      query = db.collection(collectionName).where('donated', '<', threeMonthsBack).limit(recordsPerPage);
    } else {
      query = db.collection(collectionName).limit(recordsPerPage);
    }    
  }
  query.get().then((querySnapshot) => {
    lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
    querySnapshot.forEach((doc) => {
      $('#donors > tbody').append($('<tr>')
        .append($('<td scope="row">').text(doc.data().first + ' ' + doc.data().last))
        .append($('<td>').text(doc.data().gender))
        .append($('<td>').text(age(doc.data().born.toDate())))
        .append($('<td>').text(doc.data().group))
        .append($('<td>').text(doc.data().atoll))
        .append($('<td>').text(doc.data().island))
        .append($('<td>').text(doc.data().phone))
        .append($('<td>').text(humanDate(doc.data().donated.toDate(), false)))
      );
      if(isAdmin) {
        $('#donors tbody tr:last-child').append($('<td>').html('<span class="delete" id="delete-' + doc.id + '">' + matIconDelete + '</span>'));
        $('#delete-' + doc.id).on('click', function(event) {
          $('#delete-' + doc.id).html(matIconRefresh).addClass('icon-spin');
          deleteDonor(doc.id, doc.data().first + ' ' + doc.data().last);
        });
      }
    });
    $(progressElement).hide();
    $(loadMoreElement).show();
    if(!lastVisible) {
      $(loadMoreElement).off();
      $(loadMoreElement + ' > a').addClass('disabled').html(matIconMoreHoriz + 'End of the World' + matIconMoreHoriz);
    } else {
      $(loadMoreElement + ' > a').removeClass('disabled').html('Load More' + matIconExpandMore);
      $(loadMoreElement).off().on('click', function() {
        loadBloodDonors(getKeyValueStore('includeOnlyDonatable'), true);
      });
    }
  });    
}


function deleteDonor(docId, donorName) {
  if(confirm('Are you sure you want to delete the donor "' + donorName + '"?')) {
    db.collection(collectionName).doc(docId).delete()
    .then(function(docRef) {
      $('#delete-' + docId).parent().parent().addClass('deleted');
      setTimeout(function() { $('#delete-' + docId).parent().parent().remove(); }, 1500);
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


$(document).ready($(topLoader).hide());
