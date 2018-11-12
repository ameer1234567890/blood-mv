/*jshint esversion: 6 */
/*globals $, tableSearch, setKeyValueStore, getKeyValueStore, age, humanDate, db, topLoader, matIconMoreHoriz, matIconExpandMore */

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

$(document).ready($(topLoader).hide());
