const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
var db = admin.firestore();
db.settings({timestampsInSnapshots: true});
const https = require('https');


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


exports.tokenDetails = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        var token = req.body.token;
        var authHeader = 'key=' + functions.config().fcm.serverkey;
        var options = {
          host: 'iid.googleapis.com',
          port: 443,
          path: '/iid/info/' + token + '?details=true',
          method: 'GET',
          headers: { 'Authorization': authHeader }
        };
        https.get(options, (resp) => {
          let data = '';
          resp.on('data', (chunk) => {
            data += chunk;
          });
          resp.on('end', () => {
            console.log(data);
            res.status(200).send(data);
          });
        }).on('error', (err) => {
          console.log('Error: ' + err.message);
          res.status(500).send('{"status": "ERROR", "message": "Error getting token details"}');
        });
      } else {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
      }
      return true;
    })
    .catch((error) => {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
    });
});


exports.sendMessageViaWeb = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        var topic = req.body.topic;
        var messageBody = req.body.message;
        var message = {
          data: {
            title: 'Blood MV',
            body: messageBody,
            icon: '/favicon.png',
            badge: '/icons/badge.png',
            click_action: '/request/'
          },
          topic: topic
        };
        console.log(message);
        admin.messaging().send(message)
          .then((response) => {
            console.log('Successfully sent message: ', response);
            res.status(200).send('{"status": "OK", "message": "Message sent"}');
            return true;
          })
          .catch((error) => {
            console.log('Error sending message: ', error);
            res.status(500).send('{"status": "ERROR", "message": "Error sending message"}');
            return false;
          });
      } else {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
      }
      return true;
    })
    .catch((error) => {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
    });
});


exports.listUsers = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        var users = '{';
        admin.auth().listUsers(1000)
          .then((listUsersResult) => {
            numUsers = 0;
            listUsersResult.users.forEach((userRecord) => {
              numUsers++
            });
            numRecords = 0;
            listUsersResult.users.forEach((userRecord) => {
              numRecords++;
              users += '"' + userRecord.uid + '":';
              users += JSON.stringify(userRecord.toJSON());
              if(numRecords !== numUsers) {
                users += ',';
              }
            });
            users += '}';
            console.log(users);
            res.status(200).send(users);
            return true;
          })
          .catch((error) => {
            console.log('Error listing users: ', error);
            res.status(500).send('{"status": "ERROR", "message": "Error listing users"}');
            return false;
          });
      } else {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
      }
      return true;
    })
    .catch((error) => {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
    });
});


exports.deleteUser = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        var uid = req.body.uid;
        admin.auth().deleteUser(uid)
          .then( () => {
            console.log('Successfully deleted user');
            res.status(200).send('{"status": "OK", "message": "User deleted successfully"}');
            return true;
          })
          .catch((error) => {
            console.log('Error deleting user: ', error);
            res.status(500).send('{"status": "ERROR", "message": "Error deleting user"}');
            return false;
          });
      } else {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
      }
      return true;
    })
    .catch((error) => {
        console.log('Error: Not an admin user!');
        res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
        return false;
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
