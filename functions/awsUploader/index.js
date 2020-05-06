const { getSignedUrl, uploadS3Stream } = require("../utils/aws");

exports.createHandler = async (snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const fileName = `${srcPath}.wav`;
  const readStream = bucket.file(srcPath).createReadStream();
  const serviceName = "dpe";
  const destPath = `${serviceName}/${fileName}`;
  const metadata = snap.data();
  const durationSeconds = Math.ceil(metadata.duration);
  const fileSize = metadata.size;
  try {
    const uploadUrl = await getSignedUrl(aws, fileName, durationSeconds);
    await uploadS3Stream(uploadUrl, readStream, fileSize);
    console.log(
      `[COMPLETE] Finished upload to s3://${aws.bucket.name}/${destPath}`
    );
  } catch (err) {
    console.error(`[ERROR] ${err}`);
    return;
  }
};
