/* jshint esversion: 6 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });
const https = require('https');
const storage = admin.storage();
const os = require('os');
const fs = require('fs');
const path = require('path');


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
  console.log('Function Version: v33');
  const filePath = '/feed/rss.txt';
  const tempfileName = 'rss.txt';
  const tempFilePath = path.join(os.tmpdir(), tempfileName);
  storage.bucket().file(filePath).download({
    destination: tempFilePath,
  }).then(() => {
    rssData = fs.readFileSync(tempFilePath);
    fs.unlinkSync(tempFilePath);
    return res.status(200).send(rssData);
  }).catch(() => {
    res.status(500).send('Error!');
  });
});

exports.prepareRssFeed = functions.firestore.document('requests/{docId}').onCreate((snap, context) => {
  console.log('Function Version: v15');
  const collectionName = 'requests';
  const recordsPerPage = 4;
  var msgBody = '';
  var rssData = '<?xml version="1.0" encoding="UTF-8" ?>\n';
  rssData += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rssData += '  <channel>\n';
  rssData += '    <title>Blood MV</title>\n';
  rssData += '    <description>Blood requests on Blood MV</description>\n';
  rssData += '    <link>https://blood-mv.firebaseapp.com/requests/</link>\n';
  rssData += '    <language>en-us</language>\n';
  rssData += '    <atom:link href="https://blood-mv.firebaseapp.com/feed" rel="self" type="application/rss+xml" />\n';
  rssData += '    <pubDate>Mon, 17 Dec 2018 12:20:00 +0500</pubDate>\n';
  db.collection(collectionName).limit(recordsPerPage).get().then((querySnapshot) => {
    var numRecords = querySnapshot.size;
    var i = 0;
    querySnapshot.forEach((doc) => {
      i++;
      msgBody = doc.data().group + ' requested at ' + doc.data().place + ' Contact ' + doc.data().phone;
      rssData += '    <item>\n';
      rssData += '      <title>' + msgBody + '</title>\n';
      rssData += '      <description>' + msgBody + '</description>\n';
      rssData += '      <link>https://blood-mv.firebaseapp.com/requests/#request-' + doc.id + '</link>\n';
      rssData += '      <guid isPermaLink="false">' + doc.id + '</guid>\n';
      rssData += '      <pubDate>' + doc.data().datetime.toDate().toUTCString() + '</pubDate>\n';
      rssData += '    </item>\n';
      if(i === numRecords) {
        rssData += '  </channel>\n';
        rssData += '</rss>';
      }
    });
    return rssData;
  }).then((rssData) => {
    const fileName = 'rss.txt';
    const destination = '/feed/rss.txt';
    const tempFilePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tempFilePath, rssData );
    storage.bucket().upload( tempFilePath, { destination } );
    console.log('Feed updated!');
    return fs.unlinkSync(tempFilePath);
  }).catch(() => {
    console.error('Error!');
  });
});
