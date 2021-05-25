const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { info, error } = require('firebase-functions/lib/logger');

const convertStreamToAudio = (inputFile, outputStream, jobData) => {
  info('[START] ffmpeg job', jobData);

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .toFormat('wav')
      .audioFrequency(16000)
      .on('start', (cmd) => {
        // console.debug("Started " + cmd);
        info('[IN PROGRESS] ffmpeg job', jobData, `command ${ cmd }`);
      })
      // .on('codecData', (data) => {
      //   console.debug(`Input codec is `, data);
      // })
      .on('error', (err, stdout, stderr) => {
        // console.debug(err.message); //this will likely return "code=1" not really useful
        // console.debug("stdout:\n" + stdout);
        // console.debug("stderr:\n" + stderr); //this will contain more detailed debugging info
        error('[ERROR] ffmpeg job', jobData, ', error:', err, ', stderr:', stderr);
        reject(err);
      })
      .on('progress', (progress) => {
        // info('[IN PROGRESS] ffmpeg job', progress);
        // console.debug(`Processing: ${ progress.percent }% done`);
      })
      .on('end', (stdout, stderr) => {
        // console.debug(stdout, stderr);
        // console.debug("Transcoding succeeded!");
        info('[COMPLETE] ffmpeg job', jobData);
        resolve();
      })
      .pipe(outputStream, { end: true });
  });
};

exports.createHandler = async (snap, bucket, context) => {
  const { userId, itemId } = context.params;
  const { projectId, originalName, duration } = snap.data();

  // const { userId, itemId } = { userId: 'gLoKESQNkVavUfSiqqoSEEEa6Lo2', itemId: 'mZ2wfaKxtIwPf6hNJ0nK' }
  // const { projectId, originalName, duration } = { projectId: 'jyfgomux3r2BppMjzla3', originalName: 'Data Team Segmentation Hackweek Part 1.mov', duration: '237.496208' }

  // const { userId, itemId } = { userId: 'gLoKESQNkVavUfSiqqoSEEEa6Lo2', itemId: 'laicyaKDCDDlnTIxDI8y' }
  // const { projectId, originalName, duration } = { projectId: '5QxkyK2vQy5PoklnKSsa', originalName: 'DID short.wav', duration: '909.180771' }
  info(`[START] Converting media to wav and uploading audio file ${ { userId, itemId, projectId } }`);

  const srcFile = bucket.file(`users/${ userId }/uploads/${ itemId }`);
  const outFile = bucket.file(`users/${ userId }/audio/${ itemId }`);

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
  });

  const jobData = {
    item: itemId,
    project: projectId,
    user: userId
  };

  try {
    info('[START] Download file to temp directory', jobData);
    const srcPath = path.join(os.tmpdir(), `/${ itemId }`);
    await srcFile.download({ destination: srcPath });
    info(`[COMPLETE] Download file to temp directory ${ srcPath }`, jobData);

    info('[START] Convert file to wav', jobData);
    await convertStreamToAudio(srcPath, writeStream, jobData);
    info('[COMPLETE] Convert file to wav', jobData);

    info(`[START] Delete file from temp directory ${ srcPath }`, jobData);
    await fs.unlink(srcPath);
    info(`[COMPLETE] Delete file from temp directory ${ srcPath }`, jobData);
  } catch (err) {

    return error('[ERROR] Could not transform audio file: ', { ...jobData, err });
  }

  return info(
    '[COMPLETE] Converting media to wav and uploading audio file', jobData, `to ${ bucketName }/users/${ userId }/audio/${ itemId }`
  );
};
