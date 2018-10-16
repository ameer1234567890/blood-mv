const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.subscribeToTopic = functions.https.onRequest((req, res) => {
  var registrationTokens = [ req.body.token ];
  var topic = req.body.topic;
  admin.messaging().subscribeToTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully subscribed to topic:', response);
      res.status(500).send();
      return true;
    })
    .catch((error) => {
      console.log('Error subscribing to topic:', error);
      res.status(500).send();
    });
});
