const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

/**
 * `convertToAudio` - converts video or audio file into audio feel that meets STT specs
 * Uses ffmpeg. ffmpeg binary is installed and available on cloud functions by default.
 * When done converting it uploads the audio to Google Cloud Storage
 * removes the converted file on the cloud function
 * returns `targetStorageFilePath` the path to the new converted file, saved in cloud storage
 * modified from  https://github.com/firebase/functions-samples/blob/master/ffmpeg-convert-audio/functions/index.js
 * @param {*} storageRef
 * @param {*} downloadURLLink
 */
exports.convertToAudio = async (admin, storageRef, downloadURLLink, AUDIO_EXTENSION, SAMPLE_RATE_HERTZ) => {
  return new Promise(async (resolve, reject) => {
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
    // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
    const targetTempFileName = fileName.replace(/\.[^/.]+$/, '') + `_output.${AUDIO_EXTENSION}`;
    const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
    const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

    ffmpeg(downloadURLLink)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(SAMPLE_RATE_HERTZ)
      .audioCodec('libopus')
      .output(targetTempFilePath)
      .on('end', async () => {
        // Uploading the audio Google Cloud Storage
        await bucket.upload(targetTempFilePath, {
          destination: targetStorageFilePath,
          // without resumable false, this seems to fail
          resumable: false,
        });
        // Once the audio has been uploaded delete the local file to free up disk space.
        fs.unlinkSync(targetTempFilePath);
        resolve(targetStorageFilePath);
      })
      .on('error', err => {
        reject(err);
      })
      .run();
  });
};
