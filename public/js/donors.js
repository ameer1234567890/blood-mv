/* jshint esversion: 6 */
/* jshint browser: true */
/* globals $, tableSearch, setKeyValueStore, getKeyValueStore, age, humanDate, db, topLoader,
   matIconMoreHoriz, matIconExpandMore, matIconDelete, matIconRefresh, getRandomFact, relativeDate, isAdmin */

var loadMoreElement = '.load-more';
var collectionName = 'donors';
var recordsPerPage = 10;
var lastVisible;
var deleteHeaderShown = false;


// Search the table when something is entered in search box
$('#search').on('keyup', function(event) {
  var searchElement = document.getElementById('search');
  var tableElement = document.getElementById('donors');
  tableSearch(searchElement, tableElement);
});


// Reload list of donors when toggle is clicked
$('#display-toggle').on('click', function(event) {
  if($('#display-toggle').prop('checked')) {
    $('#donors').find('tr:gt(0)').remove();
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    setKeyValueStore('includeOnlyDonatable', false);
    loadBloodDonors(false);
  } else {
    $('#donors').find('tr:gt(0)').remove();
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row odd"><td colspan="8">&nbsp;</td></tr>'));
    $('#donors > tbody').append($('<tr class="skeleton-row even"><td colspan="8">&nbsp;</td></tr>'));
    setKeyValueStore('includeOnlyDonatable', true);
    loadBloodDonors(true);
  }
});


// Load donors table
if(getKeyValueStore('includeOnlyDonatable')) {
  $('#display-toggle').prop('checked', '');
  loadBloodDonors(true);
} else {
  $('#display-toggle').prop('checked', 'checked');
  loadBloodDonors(false);
}


// Show a random fact
document.getElementById('fact').innerHTML = getRandomFact();


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
    var firstDoc = querySnapshot.docs[0];
    $('#donors > tbody > .skeleton-row').remove();
    querySnapshot.forEach((doc) => {
      $('#donors > tbody').append($('<tr id="request-' + doc.id + '">')
        .append($('<td scope="row">').text(doc.data().first + ' ' + doc.data().last))
        .append($('<td>').text(doc.data().gender))
        .append($('<td>').text(age(doc.data().born.toDate())))
        .append($('<td>').text(doc.data().group))
        .append($('<td>').text(doc.data().atoll + ' - ' + doc.data().island))
        .append($('<td>').text(doc.data().phone))
        .append($('<td>').text(relativeDate(doc.data().donated.toDate())).addClass('tooltipped').attr('data-tooltip', humanDate(doc.data().donated.toDate(), false)))
      );
      if(isAdmin) {
        if(!deleteHeaderShown) {
          $('#donors thead tr:last-child').append($('<th>').html('Delete'));
          deleteHeaderShown = true;
        }
        $('#donors tbody tr:last-child').append($('<td>').html('<span class="delete" id="delete-' + doc.id + '">' + matIconDelete + '</span>'));
        $('#delete-' + doc.id).on('click', function(event) {
          $('#delete-' + doc.id).html(matIconRefresh).addClass('icon-spin');
          deleteDonor(doc.id, doc.data().first + ' ' + doc.data().last);
        });
      }
      if(loadMore) {
        $('html, body').stop().animate({scrollTop: $('#request-' + firstDoc.id).offset().top - 78}, 1000);
      }
      $('.tooltipped').tooltip();
    });
    $(loadMoreElement).show();
    if(!lastVisible) {
      $(loadMoreElement).off();
      $(loadMoreElement + ' > a').addClass('disabled').html(matIconMoreHoriz + ' End of the World ' + matIconMoreHoriz).removeClass('icon-spin');
    } else {
      $(loadMoreElement + ' > a').removeClass('disabled').html('Load More ' + matIconExpandMore).removeClass('icon-spin');
      $(loadMoreElement).off().on('click', function() {
        $(loadMoreElement + ' > a').html('Load More ' + matIconRefresh).addClass('icon-spin');
        loadBloodDonors(getKeyValueStore('includeOnlyDonatable'), true);
      });
    }
  });    
}


function deleteDonor(docId, donorName) {
  if(confirm('Are you sure you want to delete the donor "' + donorName + '"?')) {
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


$(document).ready($(topLoader).hide());
