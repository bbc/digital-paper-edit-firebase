const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const gcpToDpe = require('gcp-to-dpe');
// const twilio = require('twilio');
// firebase-admin module allows us to use the Firebase platform on a server with admin access, for instance to write to the Cloud Firestore or send FCM notifications.

admin.initializeApp();

// const serviceAccount = require('./serviceAccountKey.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://dj-con-innovation-dpe-web-poc.firebaseio.com',
// });

// TODO: cloud function - enable Cloud Build
// https://github.com/firebase/firebase-tools/issues/2295#issuecomment-634404919

// TODO: split in multiple files

//////////////////////////////////////////////////////////////////////////////
// const createPresignedUrl = require('./aws-create-presigned-url/index.js');
// For this to run locally `firebase functions:config:get > .runtimeconfig.json` in `functions` folder. also add to gitignore!
// exports.getAwsPresignedUrl = functions.https.onCall((data, context) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' + 'while authenticated.');
//   }
//   // pre-signed url function needs to use ENV
//   // https://cloud.google.com/functions/docs/env-var
//   // to set in firebase enviroment do
//   // firebase functions:config:set aws.aws_access_key_id="XXXX" aws.aws_scret_access_key="XXXX"
//   let url = createPresignedUrl({
//     key: functions.config().aws.aws_access_key_id,
//     secret: functions.config().aws.aws_scret_access_key,
//   });

//   return { url };
// });
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// firebase functions:config:set twilio.sid="YOUR_ACCOUNT_SID" twilio.token="YOUR_AUTH_TOKEN"
// https://angularfirebase.com/lessons/sms-texting-with-twilio/
// exports.makePhoneCall = functions.https.onCall((data, context) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' + 'while authenticated.');
//   }
//   const twillioPhoneNumber = '+12089532138';
//   const toPhoneNumber = data.phoneNumber;

//   const accountSid = functions.config().twilio.sid;
//   const authToken = functions.config().twilio.token;
//   const client = new twilio(accountSid, authToken);

//   const main = async () => {
//     try {
//       const call = await client.calls.create({
//         //  method: 'GET',
//         //  statusCallback: 'https://www.myapp.com/events',
//         //  statusCallbackEvent: ['initiated', 'answered', 'completed'],
//         //  statusCallbackMethod: 'POST',
//         // replace with https://www.twilio.com/console/twiml-bins/create,
//         // https://www.twilio.com/docs/voice/make-calls#manage-your-outbound-call
//         // record: true,
//         url: 'http://demo.twilio.com/docs/voice.xml',
//         to: toPhoneNumber,
//         from: twillioPhoneNumber,
//       });

//       console.log(call);
//       // should save callSid `call.sid` to firestore
//       return {
//         status: 'OK',
//         text: `calling ${toPhoneNumber} from ${twillioPhoneNumber}`,
//         callSid: call.sid,
//       };
//     } catch (e) {
//       console.error(e);
//       return { status: 'error', error: e };
//     }
//   };

//   return main();
// });
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// TODO: Google cloud function triggers Goolge App Engine
// Goolge App Engine calls STT SDK
// this function returns null.
// timeout 1min to 9min https://cloud.google.com/functions/docs/concepts/exec#timeout
// https://firebase.google.com/docs/functions/firestore-events
exports.createTranscript = functions.firestore.document('projects/{projectId}/transcripts/{transcriptId}').onCreate(async (change, context) => {
  // Get an object representing the document
  const newValue = change.data();
  // access a particular field as you would any JS property
  const storageRef = newValue.storageRefName;
  // https://firebase.google.com/docs/storage/admin/start
  const storage = admin.storage();
  // https://github.com/firebase/firebase-tools/issues/1573#issuecomment-517000981
  const bucket = storage.appInternal.options.storageBucket;
  // // const gcsUri = 'gs://my-bucket/audio.raw';
  const gcsUri = `gs://${bucket}/${storageRef}`;
  //////// STT ////////
  // Creates a client for STT
  const client = new speech.SpeechClient();
  const encoding = 'mp3'; //'Encoding of the audio file, e.g. LINEAR16';
  const sampleRateHertz = '48000'; //16000;
  // const languageCode = newValue.language.value;
  const languageCode = 'en-US'; //'BCP-47 language code, e.g. en-US';

  const config = {
    // https://cloud.google.com/speech-to-text/docs/async-time-offsets
    enableWordTimeOffsets: true,
    // https://cloud.google.com/speech-to-text/docs/automatic-punctuation
    enableAutomaticPunctuation: true,
    // https://cloud.google.com/speech-to-text/docs/multiple-voices
    enableSpeakerDiarization: true,
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  };

  const audio = {
    uri: gcsUri,
  };

  const request = {
    config: config,
    audio: audio,
  };

  //   // Detects speech in the audio file. This creates a recognition job that you
  //   // can wait for now, or get its result later.
  const [operation] = await client.longRunningRecognize(request);
  // Get a Promise representation of the final result of the job
  const [response] = await operation.promise();
  // TODO: can we get speaker diarization? as part of DPE conversion.
  const transcript = gcpToDpe(response);
  const { paragraphs, words } = transcript;
  // Then return a promise of a set operation to update the document
  return change.ref.set(
    {
      // TODO: change transcription to transcript
      paragraphs,
      words,
      // TODO: handle if done, in progress, error
      status: 'done',
    },
    {
      merge: true,
    }
  );
  // } else {
  //   return null;
  // }
});
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
exports.deleteTranscriptMedia = functions.firestore.document('projects/{projectId}/transcripts/{transcriptId}').onDelete(async (snap, context) => {
  const defaultStorage = admin.storage();
  const deletedValue = snap.data();
  const storageRefPath = deletedValue.storageRefName;
  const bucket = defaultStorage.bucket();
  const file = bucket.file(storageRefPath);
  return file.delete();
});
//////////////////////////////////////////////////////////////////////////////
// exports.deleteTranscriptMediaForProject = functions.firestore.document('projects/{projectId}').onDelete(async (snap, context) => {
//   const defaultStorage = admin.storage();
//   const deletedValue = snap.data();
//   // iterate through projects transcripts to get the storageRef value
//   const storageRefPath = deletedValue.storageRefName;
//   const bucket = defaultStorage.bucket();
//   const file = bucket.file(storageRefPath);
//   return file.delete();
// });
