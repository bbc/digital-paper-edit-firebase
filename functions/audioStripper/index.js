const ffmpeg = require("fluent-ffmpeg");

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
      .on("start", cmd => {
        console.log("Started " + cmd);
      })
      .on("codecData", data => {
        console.log(
          "Input is " + data.audio + " audio " + "with " + data.video + " video"
        );
      })
      .on("error", (err, stdout, stderr) => {
        console.log(err.message); //this will likely return "code=1" not really useful
        console.log("stdout:\n" + stdout);
        console.log("stderr:\n" + stderr); //this will contain more detailed debugging info
        reject(err);
      })
      .on("progress", progress => {
        console.log(progress);
        console.log("Processing: " + progress.percent + "% done");
      })
      .on("end", (stdout, stderr) => {
        console.log(stdout, stderr);
        console.log("Transcoding succeeded !");
        resolve();
      })
      .pipe(outputStream, { end: true });
  });
};

const getUrl = async srcFile => {
  // https://stackoverflow.com/questions/23002316/ffmpeg-pipe0-could-not-find-codec-parameters/40028894#40028894
  try {
    console.log(`[START] Getting signed URL`);
    sourceUrl = await srcFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 9 // 9 minutes
    });
    console.log(`[COMPLETE] Signed URL: ${sourceUrl}`);
    return sourceUrl;
  } catch (err) {
    console.error("[ERROR] Could not get signed URL: ", err);
    throw err;
  }
};

const getWriteStreamMetadata = (userId, itemId, originalName) => {
  return {
    metadata: {
      userId: userId,
      id: itemId,
      folder: "audio",
      originalName: originalName
    },
    contentType: "audio/wav"
  };
};

exports.createHandler = async (admin, snap, bucketName, context) => {
  const { userId, itemId } = context.params;

  const upload = snap.data();
  const storage = admin.storage();

  const bucket = storage.bucket(bucketName);

  const srcFile = bucket.file(`users/${userId}/uploads/${itemId}`);
  const outFile = bucket.file(`users/${userId}/audio/${itemId}`);

  const writeStream = outFile.createWriteStream({
    metadata: getWriteStreamMetadata(userId, itemId, upload.originalName)
  });

  try {
    const sourceUrl = await getUrl(srcFile);
    console.log(`[START] Streaming, transforming file ${sourceUrl} to audio`);
    await convertStreamToAudio(sourceUrl[0], writeStream);
  } catch (e) {
    return console.error(
      "[ERROR] Could not stream / transform audio file: ",
      e
    );
  }
  return console.log(
    `[COMPLETE] Uploaded audio file for ${userId} to ${itemId}`
  );
};
