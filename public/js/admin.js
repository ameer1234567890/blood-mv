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
            console.log('User token refreshed');
          }
        }
      });
  }).catch((error) => {
    console.log(error);
  });
});


firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
  console.log(idTokenResult.claims.admin);
   if (!!idTokenResult.claims.admin) {
     console.log('You are admin');
   } else {
     console.log('You are not admin');
   }
})
.catch((error) => {
  console.log(error);
});


$(document).ready($(topLoader).hide());
