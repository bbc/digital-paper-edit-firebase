const functions = require('firebase-functions');
const admin = require('firebase-admin');
const createTranscriptHandler = require('./createTranscript/index.js');
const firestoreCheckSTTHandler = require('./firestoreCheckSTT/index.js');
const deleteTranscriptMediaHandler = require('./deleteTranscriptMedia/index.js');

// firebase-admin module allows us to use the Firebase platform on a server with admin access, for instance to write to the Cloud Firestore or send FCM notifications.
admin.initializeApp();

const AUDIO_EXTENSION = 'ogg';
const SAMPLE_RATE_HERTZ = 16000; // or 48000
const MAX_RUNTIME_OPTS = {
  timeoutSeconds: 540, // 9 minutes
  memory: '2GB',
};
// TODO: Google cloud function triggers Goolge Cloud task
//  Goolge Cloud task calls cloud function that calls STT SDK
// this function returns null.
// timeout 1min to 9min https://cloud.google.com/functions/docs/concepts/exec#timeout
// https://firebase.google.com/docs/functions/firestore-events
exports.createTranscript = functions
  .runWith(MAX_RUNTIME_OPTS)
  .firestore.document('projects/{projectId}/transcripts/{transcriptId}')
  .onCreate(async (change, context) => {
    return await createTranscriptHandler.createHandler(change, context, admin, AUDIO_EXTENSION, SAMPLE_RATE_HERTZ);
  });

// function to retrieve STT data from GCP STT operation
// does this   .runWith(MAX_RUNTIME_OPTS) ?
exports.firestoreCheckSTT = functions.https.onRequest(async (req, res) => {
  return await firestoreCheckSTTHandler.createHandler(req, res, admin, functions);
});

exports.deleteTranscriptMedia = functions.firestore.document('projects/{projectId}/transcripts/{transcriptId}').onDelete(async (snap, context) => {
  return await deleteTranscriptMediaHandler.createHandler(snap, context, admin);
});
