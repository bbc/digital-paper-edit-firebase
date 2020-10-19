const ffmpeg = require("fluent-ffmpeg");
const { getStorageSignedUrl } = require("../utils/firebase");

const {
  updateTranscription
} = require("../utils/firebase");

// Will NOT work for MP4 Streams
// https://stackoverflow.com/questions/23002316/ffmpeg-pipe0-could-not-find-codec-parameters/40028894#40028894
const convertStreamToAudio = (inputStream, outputStream) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .toFormat("wav")
      .audioFrequency(16000)
      .on("start", (cmd) => {
        // console.debug("Started " + cmd);
      })
      .on("codecData", (data) => {
        // console.debug(`Input is ${data.audio} audio with ${data.video} video`);
      })
      .on("error", (err, stdout, stderr) => {
        // console.debug(err.message); //this will likely return "code=1" not really useful
        // console.debug("stdout:\n" + stdout);
        // console.debug("stderr:\n" + stderr); //this will contain more detailed debugging info
        reject(err);
      })
      .on("progress", (progress) => {
        // console.debug(progress);
        // console.debug(`Processing: ${progress.percent}% done`);
      })
      .on("end", (stdout, stderr) => {
        // console.debug(stdout, stderr);
        // console.debug("Transcoding succeeded!");
        resolve();
      })
      .pipe(outputStream, { end: true });
  });
};

exports.createHandler = async (admin, snap, bucket, context) => {
  const { userId, itemId } = context.params;
  const { projectId, originalName, duration } = snap.data();

  const srcFile = bucket.file(`users/${userId}/uploads/${itemId}`);
  const outFile = bucket.file(`users/${userId}/audio/${itemId}`);

  const metadata = {
    metadata: {
      id: itemId,
      userId: userId,
      projectId: projectId,
      folder: "audio",
      originalName: originalName,
      duration: duration,
    },
    contentType: "audio/wav",
  };

  const writeStream = outFile.createWriteStream({
    metadata: metadata,
  });

  try {
    const sourceUrl = await getStorageSignedUrl(srcFile);
    console.log(`[START] Streaming, transforming file ${sourceUrl} to audio`);
    await convertStreamToAudio(sourceUrl[0], writeStream);
  } catch (err) {
    await updateTranscription(admin, itemId, projectId, {
        status: "error",
        message: "Could not strip audio! Please reupload the file.",
    });
    return console.error(
      "[ERROR] Could not stream / transform audio file: ",
      err
    );
  }
  return console.log(
    `[COMPLETE] Uploaded audio file for ${userId} to ${itemId}`
  );
};
