const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


exports.subscribeToTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().subscribeToTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully subscribed to topic:', response);
      res.status(200).send('{"status": "OK","message": "Successfully subscribed to topic"}');
      return true;
    })
    .catch((error) => {
      console.log('Error subscribing to topic:', error);
      res.status(500).send('{"status": "ERROR","message": "Error subscribing to topic"}');
    });
});


exports.unsubscribeFromTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().unsubscribeFromTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully unsubscribed from topic:', response);
      res.status(200).send('{"status": "OK","message": "Successfully unsubscribed from topic"}');
      return true;
    })
    .catch((error) => {
      console.log('Error unsubscribing to topic:', error);
      res.status(500).send('{"status": "ERROR","message": "Error unsubscribing from topic"}');
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
    notification: {
      title: 'Blood MV',
      body: messageBody,
    },
    android: {
      priority: 'normal',
      notification: {
        title: 'Blood MV',
        body: messageBody,
        icon: "/favicon.png",
      },
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          alert: {
            title: 'Blood MV',
            body: messageBody,
          },
        },
      },
    },
    webpush: {
      notification: {
        title: 'Blood MV',
        body: messageBody,
        icon: '/favicon.png'
      },
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
