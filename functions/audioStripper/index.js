const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');
// const fs = require('fs');
// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
const { info, error } = require('firebase-functions/lib/logger');
const { getStorageSignedUrl } = require('../utils/firebase');

// Will NOT work for MP4 Streams
// https://stackoverflow.com/questions/23002316/ffmpeg-pipe0-could-not-find-codec-parameters/40028894#40028894
const convertStreamToAudio = (inputStream, outputStream, jobData) => {
  // console.log('^^^^^')
  // console.log(inputStream, outputStream, jobData)
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream.createReadStream()
      .on('error', (err) => {
        error(`[ERROR] Create read stream error ${ inputStream }`, err);
      }))
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .toFormat('wav')
      .audioFrequency(16000)
      .on('start', (cmd) => {
        // console.debug("Started " + cmd);
        info(`[START] ffmpeg job ${ jobData } command ${ cmd } at ${ new Date() }`);
      })
      .on('codecData', (data) => {
        // console.debug(`Input is ${data.audio} audio with ${data.video} video`);
      })
      .on('error', (err, stdout, stderr) => {
        // console.debug(err.message); //this will likely return "code=1" not really useful
        // console.debug("stdout:\n" + stdout);
        // console.debug("stderr:\n" + stderr); //this will contain more detailed debugging info
        error('[ERROR] ffmpeg job', jobData, ', error:', err, ', stderr:', stderr);
        reject(err);
      })
      .on('progress', (progress) => {
        info('[IN PROGRESS] ffmpeg job', jobData, ', error:', err, ', stderr:', stderr);
        console.debug(`Processing: ${ progress.percent }% done`);
      })
      .on('end', (stdout, stderr) => {
        // console.debug(stdout, stderr);
        // console.debug("Transcoding succeeded!");
        info('[COMPLETE] ffmpeg job', jobData, `at ${ new Date() }`);
        resolve();
      })
      .pipe(outputStream, { end: true });
  });
};

exports.createHandler = async (snap, bucket, context) => {
// exports.createHandler = async () => {
  const { userId, itemId } = context.params;
  const { projectId, originalName, duration } = snap.data();

  // const { userId, itemId } = { userId: 'gLoKESQNkVavUfSiqqoSEEEa6Lo2', itemId: 'cmUaoSARcYKC9vo7ll93' }
  // const { projectId, originalName, duration } = { projectId: '5QxkyK2vQy5PoklnKSsa', originalName: 'frow 4 mins.wav', duration: '237.496208' }

  // const { userId, itemId } = { userId: 'gLoKESQNkVavUfSiqqoSEEEa6Lo2', itemId: 'laicyaKDCDDlnTIxDI8y' }
  // const { projectId, originalName, duration } = { projectId: '5QxkyK2vQy5PoklnKSsa', originalName: 'DID short.wav', duration: '909.180771' }

  // const config = functions.config();

  // const bucketName = config.storage.bucket;
  // const bucket = admin.storage().bucket(bucketName);
  const srcFile = bucket.file(`users/${ userId }/uploads/${ itemId }`);
  const outFile = bucket.file(`users/${ userId }/audio/${ itemId }`);

  // const srcFile = fs.createReadStream(path.join(
  //   __dirname,
  //   '/frow.wav',
  // ));
  // const outFile = fs.createWriteStream(path.join(
  //   __dirname,
  //   '/DID-converted.wav',
  // ));
  // console.log(srcFile)
  // console.log(outFile)
  const metadata = {
    metadata: {
      id: itemId,
      userId: userId,
      projectId: projectId,
      folder: 'audio',
      originalName: originalName,
      duration: duration,
    },
    contentType: 'audio/wav',
  };

  const writeStream = outFile.createWriteStream({
    metadata: metadata,
    resumable: false
  })
    .on('error', (err) => {
      error('[ERROR] error in write stream: ', err);
    });
  // console.log(writeStream)
  // const writeStream = outFile

  const jobData = {
    item: itemId,
    project: projectId,
    user: userId
  };

  try {
    // info('[START] audioStripper. Fetching signed storage URL for', jobData);
    const sourceUrl = await getStorageSignedUrl(srcFile);
    //theme hospital mp3
    // const sourceUrl = ['https://firebasestorage.googleapis.com/v0/b/dev-digital-paper-edit/o/users%2FgLoKESQNkVavUfSiqqoSEEEa6Lo2%2Fuploads%2F3O8dFNJ9kBtsnLRseioh?alt=media&token=d301bfcc-0b17-475c-ab5d-2b36ac1748df']
    // const makeDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(pathToFile)}?alt=media&token=${downloadToken}`;
    //frow.wav
    // const sourceUrl = ['https://firebasestorage.googleapis.com/v0/b/dev-digital-paper-edit/o/users%2FgLoKESQNkVavUfSiqqoSEEEa6Lo2%2Fuploads%2FowOPEU3MuFHzq7R2tViY?alt=media&token=0b62bad6-264e-45e4-b4e2-984047a73edc']
    // const sourceUrl = ['https://storage.googleapis.com/dev-digital-paper-edit/users/gLoKESQNkVavUfSiqqoSEEEa6Lo2/uploads/owOPEU3MuFHzq7R2tViY']
    //public file
    // const sourceUrl = ['https://storage.googleapis.com/dev-digital-paper-edit/users/gLoKESQNkVavUfSiqqoSEEEa6Lo2/uploads/owOPEU3MuFHzq7R2tViY']
    //local file
    // const sourceUrl = [ srcFile ]

    // const srcStream = fs.createReadStream(sourceUrl[0]);
    // info(`[IN PROGRESS] Convert file ${ srcFile } to wav audio`, jobData);
    info(`[IN PROGRESS] Convert file ${ sourceUrl } to wav audio`, jobData);

    // srcFile.createReadStream()
    //   .on('error', (err) => {
    //     error(`[ERROR] Create read stream error ${ srcFile }`, err);
    //   });
    // await convertStreamToAudio(srcFile, writeStream, jobData);
    await convertStreamToAudio(sourceUrl[0], writeStream, jobData);
  } catch (err) {

    return error(
      '[ERROR] Could not stream / transform audio file: ',
      {
        ...jobData,
        err
      }
    );
  }

  return info(
    '[COMPLETE] Uploaded audio file', jobData
  );
};
