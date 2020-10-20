const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const gcpToDpe = require('gcp-to-dpe');
// const twilio = require('twilio');
// firebase-admin module allows us to use the Firebase platform on a server with admin access, for instance to write to the Cloud Firestore or send FCM notifications.

admin.initializeApp();

const maxRuntimeOpts = {
  timeoutSeconds: 540, // 9 minutes
  memory: '2GB',
};

//////////////////////////////////////////////////////////////////////////////
// https://github.com/firebase/functions-samples/blob/master/ffmpeg-convert-audio/functions/index.js
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Makes an ffmpeg command return a promise.
function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

/**
 * When an audio is uploaded in the Storage bucket We generate a mono channel audio automatically using
 * node-fluent-ffmpeg.
 */

// on new file added/uploaded to cloud storage
// get file path/url
// make a file name for the output
// ffmpeg on input file
// move ffmpeg output to cloud storage
// exports.generateMonoAudio = functions
//   .runWith(maxRuntimeOpts)
//   .storage.object()
//   .onFinalize(async object => {
//     const fileBucket = object.bucket; // The Storage bucket that contains the file.
//     const filePath = object.name; // File path in the bucket.
//     const contentType = object.contentType; // File content type.
//     // Exit if this is triggered on a file that is not an audio or video file
//     // if (!contentType.startsWith('audio/') || !contentType.startsWith('video/')) {
//     //   console.log('This is not an audio or video file');
//     //   return null;
//     // }

//     // Get the file name.
//     const fileName = path.basename(filePath);
//     // Exit if the audio is already converted.
//     if (fileName.endsWith('_output.flac')) {
//       console.log('Already a converted audio.');
//       return null;
//     }

//     const bucket = admin.storage().bucket();

//     const tempFilePath = path.join(os.tmpdir(), fileName);
//     // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
//     const targetTempFileName = fileName.replace(/\.[^/.]+$/, '') + '_output.flac';
//     const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
//     const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

//     const stream = bucket.file(filePath).createReadStream();
//     // ffmpeg binary is installed and available on cloud functions
//     let command = ffmpeg(stream)
//       .audioChannels(1)
//       .audioFrequency(16000)
//       .format('flac')
//       .output(targetTempFilePath);

//     await promisifyCommand(command);
//     // Uploading the audio.
//     await bucket.upload(targetTempFilePath, { destination: targetStorageFilePath });
//     // Once the audio has been uploaded delete the local file to free up disk space.
//     fs.unlinkSync(targetTempFilePath);
//     return console.log('Temporary files removed.', targetTempFilePath);
//   });
//////////////////////////////////////////////////////////////////////////////
const AUDIO_EXTENSION = 'ogg';
const SAMPLE_RATE_HERTZ = 16000;
const convertToAudio = async (storageRef, downloadURLLink) => {
  return new Promise(async (resolve, reject) => {
    console.log('downloadURLLink', downloadURLLink);
    // exports.generateMonoAudio = functions
    //   .runWith(maxRuntimeOpts)
    //   .storage.object()
    //   .onFinalize(async object => {
    //     const fileBucket = object.bucket; // The Storage bucket that contains the file.
    //     const filePath = object.name; // File path in the bucket.
    //     const contentType = object.contentType; // File content type.
    //     // Exit if this is triggered on a file that is not an audio or video file
    //     // if (!contentType.startsWith('audio/') || !contentType.startsWith('video/')) {
    //     //   console.log('This is not an audio or video file');
    //     //   return null;
    //     // }

    // Get the file name.
    const fileName = path.basename(storageRef);
    const filePath = storageRef;
    // Exit if the audio is already converted.
    if (fileName.endsWith(`_output.${AUDIO_EXTENSION}`)) {
      console.error('Already a converted audio.');
      // return null;
      reject(new Error());
    }

    const bucket = admin.storage().bucket();

    // const tempFilePath = path.join(os.tmpdir(), fileName);
    // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
    const targetTempFileName = fileName.replace(/\.[^/.]+$/, '') + `_output.${AUDIO_EXTENSION}`;
    const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
    const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

    // const inputTempFilePath = path.join(os.tmpdir(), downloadURLLink);
    console.log('downloadURLLink', downloadURLLink);

    // https://firebase.google.com/docs/storage/extend-with-functions#download_transform_and_upload_a_file
    // try {
    //   // await bucket.file(filePath).download({ destination: inputTempFilePath });
    //   console.log('downloaded locally to', inputTempFilePath);
    //   /* eslint-disable */
    // } catch (e) {
    //   console.error("couldn't download", filePath);
    //   // throw e;
    // }

    // const stream = bucket.file(filePath).createReadStream();
    // this.storage.ref(filePath).getDownloadURL();

    // TODO: Unable to recognize speech, possible error in encoding or channel config. Please correct the config and retry the request.

    // ffmpeg binary is installed and available on cloud functions
    let command = ffmpeg(downloadURLLink)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(SAMPLE_RATE_HERTZ)
      // .format('libopus')
      .audioCodec('libopus')
      .output(targetTempFilePath)
      .on('end', async () => {
        // await promisifyCommand(command);
        // Uploading the audio.
        await bucket.upload(targetTempFilePath, {
          destination: targetStorageFilePath,
          // without resumable false, this seems to fail
          resumable: false,
        });
        // Once the audio has been uploaded delete the local file to free up disk space.
        // fs.unlinkSync(inputTempFilePath);
        fs.unlinkSync(targetTempFilePath);
        // return console.log('Temporary files removed.', targetTempFilePath);
        resolve(targetStorageFilePath);
      })
      .on('error', err => {
        reject(err);
      })
      .run();
  });
};

//////////////////////////////////////////////////////////////////////////////
// TODO: Google cloud function triggers Goolge App Engine
// Goolge App Engine calls STT SDK
// this function returns null.
// timeout 1min to 9min https://cloud.google.com/functions/docs/concepts/exec#timeout
// https://firebase.google.com/docs/functions/firestore-events
exports.createTranscript = functions
  .runWith(maxRuntimeOpts)
  .firestore.document('projects/{projectId}/transcripts/{transcriptId}')
  .onCreate(async (change, context) => {
    // Get an object representing the document
    const newValue = change.data();
    // access a particular field as you would any JS property
    const storageRef = newValue.storageRefName;
    const downloadURLLink = newValue.downloadURL;
    // https://firebase.google.com/docs/storage/admin/start
    const storage = admin.storage();
    // https://github.com/firebase/firebase-tools/issues/1573#issuecomment-517000981
    const bucket = storage.appInternal.options.storageBucket;
    // // const gcsUri = 'gs://my-bucket/audio.raw';
    const gcsUri = `gs://${bucket}/${storageRef}`;
    let audioForStt = storageRef;
    // TODO: might need to remove sample rate value, if just want to pass on flac files.
    // could be an idea, to pass on also mp3 and other google cloud compatible files, skipping conversion?
    if (storageRef.endsWith(`_output.${AUDIO_EXTENSION}`)) {
      return null;
    }

    // const downloadUrlLink = await getDownloadURL()
    if (!storageRef.endsWith(`.${AUDIO_EXTENSION}`)) {
      audioForStt = await convertToAudio(storageRef, downloadURLLink);
      console.log('audioForStt', audioForStt);
      // save audio ref
      change.ref.set(
        {
          audioUrl: audioForStt,
        },
        {
          merge: true,
        }
      );
    }

    //////// STT ////////
    // Creates a client for STT
    const client = new speech.SpeechClient();
    const encoding = 'OGG_OPUS'; //  AUDIO_EXTENSION.toUpperCase(); //'Encoding of the audio file, e.g. LINEAR16', MP3, FLAC, OGG;
    // in RecognitionConfig must either be unspecified or match the value in the FLAC header `16000`.
    const sampleRateHertz = Number(SAMPLE_RATE_HERTZ).toString(); // '48000' pr '16000';
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
      // uri: gcsUri,
      uri: `gs://${bucket}/${audioForStt}`,
    };

    const request = {
      config: config,
      audio: audio,
    };

    //   // Detects speech in the audio file. This creates a recognition job that you
    //   // can wait for now, or get its result later.
    const [operation, initialApiResponse] = await client.longRunningRecognize(request);
    console.log('operation', operation);
    console.log('initialApiResponse', initialApiResponse);
    // TODO: if it's not done, could save name of peration, and return null to close this function
    //     {
    //     name: '8700551237405696231',
    //     metadata: null,
    //     done: false
    // }
    change.ref.set(
      {
        // TODO: change transcription to transcript
        initialApiResponse,
      },
      {
        merge: true,
      }
    );

    // Get a Promise representation of the final result of the job
    const [response] = await operation.promise();
    // response === { results: [] } | if there isn't any
    // TODO: can we get speaker diarization? as part of DPE conversion.
    console.log('response', response);
    const transcript = gcpToDpe(response);
    console.log('transcript', transcript);
    const { paragraphs, words } = transcript;
    // Then return a promise of a set operation to update the document
    return change.ref.set(
      {
        // TODO: change transcription to transcript
        paragraphs,
        words,
        // storageRefName / path: storageRef,
        // audioUrl: audioForStt,
        // TODO: handle if done, in progress, error
        status: 'done',
      },
      {
        merge: true,
      }
    );
    // TODO: add error handling for STT, service that sets status to 'error'
    // eitther use promisses instead of async await or a try catch block?!
    // https://textav.gitbook.io/firebase-react-notes/stt/cloud-function-+-stt-long-running-audio-files
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
  file.delete();

  const storageRefPathAudioPreview = deletedValue.audioUrl;
  const bucketForaudio = storageRefPathAudioPreview.bucket();
  const fileAudio = bucket.file(bucketForaudio);
  return fileAudio.delete();
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
