const storage = require("@google-cloud/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { convertToAudio } = require("@bbc/convert-to-audio");

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
  }
};

exports.createHandler = async (admin, snap, bucketName, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/uploads/${itemId}`;

  const upload = snap.data();
  const storage = admin.storage();
  const bucket = storage.bucket(bucketName);

  const tmpOutPath = path.join(os.tmpdir(), itemId);
  const tmpAudioPath = path.join(os.tmpdir(), `${itemId}.wav`);

  const metadata = {
    metadata: {
      userId: userId,
      id: itemId,
      folder: "audio",
      name: upload.name
    }
  };

  const destPath = `users/${userId}/audio/${itemId}`;

  await downloadFile(bucket, tmpOutPath, srcPath);
  await convertToAudio(tmpOutPath, tmpAudioPath);
  await handleAudioUpload(bucket, destPath, tmpAudioPath, metadata);

  return cleanUp([tmpAudioPath, tmpOutPath]);
};
