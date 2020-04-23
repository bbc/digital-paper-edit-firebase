const { getSignedUrl, uploadS3Stream } = require("../utils/aws");

exports.createHandler = async (admin, snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const fileName = `${srcPath}.wav`;
  const readStream = bucket.file(srcPath).createReadStream();
  const serviceName = "dpe";
  const destPath = `${serviceName}/${fileName}`;
  const metadata = snap.data();
  const durationSeconds = Math.ceil(metadata.duration);
  const fileSize = metadata.size;
  const params = {
    Bucket: aws.name,
    Key: destPath,
    Expires: 60 * 5,
    Metadata: {
      "duration": `${durationSeconds}`,
    }
  }
  const signedUrl = await getSignedUrl(aws, params);

  console.log("[START] Upload to S3");
  try {
    const promise = uploadS3Stream(signedUrl, readStream, fileSize);
    await promise;
  } catch (err) {
    return console.error("[ERROR] Failed to upload to S3:", err);
  }

  return console.log(
    `[COMPLETE] Finished upload to s3://${aws.name}/${destPath}`
  );
};
