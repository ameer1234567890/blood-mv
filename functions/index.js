const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.subscribeToTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  // console.log(req.body); // Uncomment this line for debugging
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
  // console.log(req.body); // Uncomment this line for debugging
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
