const fs = require("fs");
const { convertStreamToAudio } = require("@bbc/convert-to-audio");

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
