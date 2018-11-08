/*jshint esversion: 6 */
/*globals $, firebase, topLoader */

$('#add-claim').on('click', function() {
  firebase.auth().signInWithPopup(provider)
  .then((result) => {
    return result.user.getIdToken();
  })
  .then((idToken) => {
    $.post(
      '/admin/addclaim',
      {idToken: idToken},
      (data, status) => {
        if (status == 'success' && data) {
          const json = JSON.parse(data);
          if (json && json.status == 'success') {
            firebase.auth().currentUser.getIdToken(true);
          }
        }
      });
  }).catch((error) => {
    console.log(error);
  });
});


$(document).ready($(topLoader).hide());
