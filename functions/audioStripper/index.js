const fs = require("fs");
const { convertStreamToAudio } = require("@bbc/convert-to-audio");

const cleanUp = files => {
  return files.forEach(f => fs.unlinkSync(f));
};

const downloadFile = async (bucket, outputPath, srcPath) => {
  console.log("[START] File downloading locally to", outputPath);
  try {
    await bucket.file(srcPath).download({ destination: outputPath });
    console.log("[COMPLETE] File downloaded locally to", outputPath);
  } catch (err) {
    console.error(`[ERROR] Failed to download file ${srcPath}: `, err);
    throw err;
  }
};

const handleAudioUpload = async (bucket, destPath, srcPath, metadata) => {
  console.log(`[START] Uploading audio file ${srcPath} to ${destPath}`);
  try {
    await bucket.upload(srcPath, {
      destination: destPath,
      metadata: metadata,
      contentType: "audio/wav"
    });
    console.log(`[COMPLETE] Uploaded audio file ${srcPath}`);
  } catch (err) {
    console.error(`[ERROR] Failed to upload audio file ${srcPath}: `, err);
    throw err;
  }
};

exports.createHandler = async (admin, snap, bucketName, context) => {
  const { userId, itemId } = context.params;

  const srcPath = `users/${userId}/uploads/${itemId}`;
  const destPath = `users/${userId}/audio/${itemId}`;

  const upload = snap.data();
  const storage = admin.storage();
  const bucket = storage.bucket(bucketName);

  const remoteReadStream = bucket.file(srcPath).createReadStream();
  const remoteWriteStream = bucket.file(destPath).createWriteStream({
    metadata: {
      metadata: {
        userId: userId,
        id: itemId,
        folder: "audio",
        originalName: upload.originalName
      },
      contentType: "audio/wav"
    }
  });

  try {
    console.log(`[START] Streaming, transforming file ${srcPath} to audio`);
    await convertStreamToAudio(remoteReadStream, remoteWriteStream);
  } catch (e) {
    console.error("[ERROR] Could not stream / transform audio file: ", e);
  }
  return console.log(`[COMPLETE] Uploaded audio file to ${destPath}`);
};
