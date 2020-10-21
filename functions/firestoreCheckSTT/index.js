const { CloudTasksClient } = require('@google-cloud/tasks');
const fetch = require('node-fetch');
const gcpToDpe = require('gcp-to-dpe');
const { getSttOperationUrl } = require('./get-stt-operation-url');
const { getSecondsSinceEpoch } = require('../createTranscript/seconds-since-epoch');
const { addMinutes } = require('../createTranscript/add-minutes');

exports.createHandler = async (req, res, admin, functions) => {
  const payload = req.body;
  console.log('payload', payload);
  console.log('payload typeof', typeof payload);
  // Does this work or does it need some processing like, JSON.parse etc..?
  const { sttOperationName, docPath } = payload;
  console.log('sttOperationName', sttOperationName);
  console.log('docPath', docPath);
  try {
    // await admin.firestore().doc(payload.docPath).delete();
    // TODO: add firebaseApiKey to ENV
    // https://stackoverflow.com/questions/34442739/how-does-one-set-private-environment-variables-on-firebase-hosting
    const firebaseApiKey = functions.config().webapi.key;
    const operationUrlEndPoint = getSttOperationUrl(sttOperationName, firebaseApiKey);
    return fetch(operationUrlEndPoint)
      .then(response => response.json())
      .then(async resp => {
        console.log('resp');
        // console.log(resp);
        if (resp.done && resp.response) {
          // TODO: save data to firestore
          // resp.response.result
          console.log('transcript');
          const transcript = gcpToDpe(resp);
          // console.log('transcript', transcript);
          console.log('transcript gcpToDpe');
          const { paragraphs, words } = transcript;
          console.log('transcript words');
          console.log('docPath', docPath);

          await admin
            .firestore()
            .doc(docPath)
            .set(
              {
                paragraphs,
                words,
                status: 'done',
              },
              {
                merge: true,
              }
            );
          console.log('admin write');
          return res.sendStatus(200);
        } else {
          console.log('else, not ready - trying task again!');
          //TODO: run cloud task
          const project = admin.instanceId().app.options.projectId;
          // https://firebase.google.com/docs/functions/locations
          const location = 'us-central1';
          const queue = 'firestore-stt';
          const tasksClient = new CloudTasksClient();
          const queuePath = tasksClient.queuePath(project, location, queue);
          const url = `https://${location}-${project}.cloudfunctions.net/firestoreCheckSTT`;
          console.log('url firestoreCheckSTT', url);
          //  const payload = { sttOperationName, docPath };
          // time of expiration expressed in epoch seconds
          const now = new Date();
          const timeFromNowWhenToCheckAgainInMinutes = 5;
          const timeFromNowWhenToCheckAgainAsDate = addMinutes(now, timeFromNowWhenToCheckAgainInMinutes);
          // Epoch, also known as Unix timestamps, is the number of seconds (not milliseconds!) that have elapsed since January 1, 1970 at 00:00:00 GMT
          const secondsSinceEpoch = getSecondsSinceEpoch(timeFromNowWhenToCheckAgainAsDate);

          await admin
            .firestore()
            .doc(docPath)
            .set(
              {
                sttOperationName,
                nextSttProgressCheckAt: timeFromNowWhenToCheckAgainAsDate,
              },
              {
                merge: true,
              }
            );

          const task = {
            httpRequest: {
              httpMethod: 'POST',
              url,
              body: Buffer.from(JSON.stringify(payload)).toString('base64'),
              headers: {
                'Content-Type': 'application/json',
              },
            },
            scheduleTime: {
              seconds: secondsSinceEpoch,
            },
          };
          const [response] = await tasksClient.createTask({ parent: queuePath, task });
          console.log(`Created task ${response.name}`);
          return res.sendStatus(200);
        }
      });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};
