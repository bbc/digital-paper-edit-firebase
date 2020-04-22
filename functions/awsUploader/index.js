const { getSignedUrl, uploadS3Stream } = require("../utils/aws");
const { getMetadata } = require("../utils");

exports.createHandler = async (admin, snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const fileName = `${srcPath}.wav`;
  const readStream = bucket.file(srcPath).createReadStream();
  const metadata = getMetadata(snap);
  const serviceName = "dpe";
  const destPath = `${serviceName}/${fileName}`;
  const duration = `${metadata.duration}`;
  const params = {
    Bucket: aws.name,
    Key: destPath,
    Expires: 60 * 5,
    Metadata: {
      "duration": duration,
    }
  }
  const signedUrl = await getSignedUrl(aws, params);

  console.log("[START] Upload to S3");
  try {
    const { writeStream, promise } = uploadS3Stream(signedUrl);
    await promise;
    readStream.pipe(writeStream);
  } catch (err) {
    return console.error("[ERROR] Failed to upload to S3:", err);
  }

  return console.log(
    `[COMPLETE] Finished upload to s3://${aws.name}/${destPath}`
  );
};
