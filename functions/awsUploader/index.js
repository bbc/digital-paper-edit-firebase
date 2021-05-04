const { info, error } = require("firebase-functions/lib/logger");
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

  const jobData = {
    item: itemId,
    project: projectId,
    user: userId
  }

  try {
    info(`[START] Attempting to upload file to s3://${aws.bucket.name}/${destPath}`, jobData)
    const uploadUrl = await getSignedUrl(aws, fileName, durationSeconds);
    await uploadS3Stream(uploadUrl, readStream, fileSize);
    info(
      `[COMPLETE] Finished upload to s3://${aws.bucket.name}/${destPath}`, jobData
    );
  } catch (err) {
    error(`[ERROR] Upload error: `, {
      ...jobData,
      err
    });
    return;
  }
};
