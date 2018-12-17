/* jshint esversion: 6 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });
const https = require('https');


exports.subscribeToTopic = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
  var registrationTokens = [req.body.token];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().subscribeToTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully subscribed to topic:', response);
      return res.status(200).send('{"status": "OK", "message": "Successfully subscribed to topic"}');
    })
    .catch((error) => {
      console.log('Error subscribing to topic:', error);
      return res.status(500).send('{"status": "ERROR", "message": "Error subscribing to topic"}');
    });
});


exports.unsubscribeFromTopic = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
  var registrationTokens = [req.body.token];
  var topic = req.body.topic;
  console.log(req.body); // Uncomment this line for debugging
  admin.messaging().unsubscribeFromTopic(registrationTokens, topic)
    .then((response) => {
      console.log('Successfully unsubscribed from topic:', response);
      return res.status(200).send('{"status": "OK", "message": "Successfully unsubscribed from topic"}');
    })
    .catch((error) => {
      console.log('Error unsubscribing to topic:', error);
      return res.status(500).send('{"status": "ERROR", "message": "Error unsubscribing from topic"}');
    });
});


exports.tokenDetails = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
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
            return res.status(200).send(data);
          });
        }).on('error', (err) => {
          console.log('Error: ' + err.message);
          return res.status(500).send('{"status": "ERROR", "message": "Error getting token details"}');
        });
      } else {
        console.log('Error: Not an admin user!');
        return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
      }
      return true;
    })
    .catch((error) => {
      console.log('Error: Not an admin user!');
      return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
    });
});


exports.sendMessageViaWeb = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
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
            click_action: '/requests/'
          },
          topic: topic
        };
        console.log(message);
        return admin.messaging().send(message);
      } else {
        console.log('Error: Not an admin user!');
        return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
      }
    })
    .then((response) => {
      console.log('Successfully sent message: ', response);
      return res.status(200).send('{"status": "OK", "message": "Message sent"}');
    })
    .catch((error) => {
      console.log('Error sending message: ', error);
      return res.status(500).send('{"status": "ERROR", "message": "Error sending message"}');
    });
});


exports.listUsers = functions.https.onRequest((req, res) => {
  console.log('Function Version: v4');
  const idToken = req.body.idToken;
  var users = '{';
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        return admin.auth().listUsers(1000);
      } else {
        console.log('Error: Not an admin user!');
        return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
      }
    })
    .then((listUsersResult) => {
      numUsers = 0;
      listUsersResult.users.forEach((userRecord) => {
        numUsers++;
      });
      numRecords = 0;
      listUsersResult.users.forEach((userRecord) => {
        numRecords++;
        users += '"' + userRecord.uid + '":';
        users += JSON.stringify(userRecord.toJSON());
        if (numRecords !== numUsers) {
          users += ',';
        }
      });
      users += '}';
      console.log(users);
      return res.status(200).send(users);
    })
    .catch((error) => {
      console.log('Error listing users: ', error);
      return res.status(500).send('{"status": "ERROR", "message": "Error listing users"}');
    })
    .catch((error) => {
      console.log('Error: Not an admin user!');
      return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
    });
});


exports.deleteUser = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.admin) {
        var uid = req.body.uid;
        return admin.auth().deleteUser(uid);
      } else {
        console.log('Error: Not an admin user!');
        return res.status(500).send('{"status": "ERROR", "message": "Not an admin user"}');
      }
    })
    .then(() => {
      console.log('Successfully deleted user');
      return res.status(200).send('{"status": "OK", "message": "User deleted successfully"}');
    })
    .catch((error) => {
      console.log('Error deleting user: ', error);
      return res.status(500).send('{"status": "ERROR", "message": "Error deleting user"}');
    });
});


exports.sendNotification = functions.firestore.document('requests/{docId}').onCreate((snap, context) => {
  console.log('Function Version: v1');
  console.log(snap.data());
  const group = snap.data().group;
  const place = snap.data().place;
  const phone = snap.data().phone;
  groups = {};
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
      click_action: '/requests/'
    },
    topic: groups[group]
  };
  console.log(message);
  admin.messaging().send(message)
    .then((response) => {
      return console.log('Successfully sent message: ', response);
    })
    .catch((error) => {
      return console.log('Error sending message: ', error);
    });
});


exports.addAdminClaim = functions.https.onRequest((req, res) => {
  console.log('Function Version: v1');
  const idToken = req.body.idToken;
  admin.auth().verifyIdToken(idToken)
    .then((claims) => {
      if (claims.email === 'ameer1234567890@gmail.com') {
        return admin.auth().setCustomUserClaims(claims.sub, { admin: true });
      } else {
        return res.end(JSON.stringify({ status: 'ineligible' }));
      }
    }).then(() => {
      return res.end(JSON.stringify({ status: 'success' }));
    }).catch((error) => {
      return res.end(JSON.stringify({ error: error }));
    });
});


exports.rssFeed = functions.https.onRequest((req, res) => {
  console.log('Function Version: v10');
  const collectionName = 'donors';
  const recordsPerPage = 4;
  var rssData = '<?xml version="1.0" encoding="UTF-8" ?>';
  rssData = '<rss version="2.0">';
  rssData = '  <channel>';
  rssData = '    <title>Blood MV</title>';
  rssData = '    <description>Blood requests on Blood MV</description>';
  rssData = '    <link>https://blood-mv.firebaseapp.com/requests/</link>';
  rssData = '    <language>en-us</language>';
  rssData = '    <pubDate>Mon, 17 Dec 2018 16:20:00 +0500</pubDate>';
  db.collection(collectionName).limit(recordsPerPage).orderBy('datetime', 'desc').get().then((querySnapshot) => {
    console.log('we are here');
    var numRecords = querySnapshot.size;
    var i = 0;
    querySnapshot.forEach((doc) => {
      console.log('reached here');
      i++;
      rssData += '    <item>';
      rssData += '      <title>' + doc.data().group + ' requested at ' + doc.data().place + '</title>';
      rssData += '      <description>' + doc.data().group + ' requested at ' + doc.data().place + '</description>';
      rssData += '      <link>https://blood-mv.firebaseapp.com/requests/#request-' + doc.id + '</link>';
      rssData += '      <guid isPermaLink="false">' + doc.id + '</guid>';
      rssData += '      <pubDate>' + doc.data().datetime + '</pubDate>';
      rssData += '    </item>';
      if(i === numRecords) {
        rssData += '  </channel>';
        rssData += '</rss>';
        console.log(rssData);
        res.status(200).send(rssData);
      }
    });
    return;
  }).catch((error) => {
    res.status(500).send('Error!');
  });
});
