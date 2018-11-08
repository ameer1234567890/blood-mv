const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
var db = admin.firestore();
db.settings({timestampsInSnapshots: true});


exports.subscribeToTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().subscribeToTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully subscribed to topic:', response);
      res.status(200).send('{"status": "OK", "message": "Successfully subscribed to topic"}');
      return true;
    })
    .catch((error) => {
      console.log('Error subscribing to topic:', error);
      res.status(500).send('{"status": "ERROR", "message": "Error subscribing to topic"}');
    });
});


exports.unsubscribeFromTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().unsubscribeFromTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully unsubscribed from topic:', response);
      res.status(200).send('{"status": "OK", "message": "Successfully unsubscribed from topic"}');
      return true;
    })
    .catch((error) => {
      console.log('Error unsubscribing to topic:', error);
      res.status(500).send('{"status": "ERROR", "message": "Error unsubscribing from topic"}');
    });
});


exports.sendNotification = functions.firestore.document('requests/{docId}').onCreate((snap, context) => {
  
  console.log(snap.data());

  const group = snap.data().group;
  const place = snap.data().place;
  const phone = snap.data().phone;

  groups = new Object();
  groups['A+'] = 'apositive';
  groups['A-'] = 'anegative';
  groups['B+'] = 'bpositive';
  groups['B-'] = 'bnegative';
  groups['O+'] = 'opositive';
  groups['O-'] = 'onegative';
  groups['AB+'] = 'abpositive';
  groups['AB-'] = 'abnegative';

  messageBody = group + ' requested at ' + place + '\nContact ' + phone;
  
  var message = {
    data: {
      title: 'Blood MV',
      body: messageBody,
      icon: '/favicon.png',
      badge: '/icons/badge.png',
      click_action: '/request/'
    },
    topic: groups[group]
  };
  console.log(message);
  
  admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message: ', response);
      return true;
    })
    .catch((error) => {
      console.log('Error sending message: ', error);
      return false;
    });
    
    return message;

});


exports.addAdminClaim = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken).then((claims) => {
    if (claims.email === 'ameer1234567890@gmail.com') {
      admin.auth().setCustomUserClaims(claims.sub, {
        admin: true
      }).then(() => {
        res.end(JSON.stringify({status: 'success'}));
        return true;
      }).catch((error) => {
        res.end(JSON.stringify({error: error}));
      });
    } else {
      res.end(JSON.stringify({status: 'ineligible'}));
    }
    return true;
  }).catch((error) => {
    res.end(JSON.stringify({error: error}));
  });
});
