/*jshint esversion: 6 */
/*globals $, tableSearch, setKeyValueStore, getKeyValueStore, age, humanDate, db, topLoader */

var progressElement = '#table-spinner';

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


function loadBloodDonors(includeOnlyDonatable) {
  if(includeOnlyDonatable) {
    var d = new Date();
    var threeMonthsBack = new Date(d.setMonth(d.getMonth() - 3));
    db.collection('donors').where('donated', '<', threeMonthsBack).get().then((querySnapshot) => {
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
    });    
  } else {
    db.collection('donors').get().then((querySnapshot) => {
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
    });
  }
}

$(document).ready($(topLoader).hide());
