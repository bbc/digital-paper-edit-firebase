const AWS = require("aws-sdk");
const stream = require("stream");

const uploadS3Stream = ({ AWSConfig, Key, Metadata }) => {
  const Bucket = AWSConfig.bucket;
  const s3 = new AWS.S3({
    region: AWSConfig.region,
    accessKeyId: AWSConfig.key,
    secretAccessKey: AWSConfig.secret,
  });
  const pass = new stream.PassThrough();

  return {
    writeStream: pass,
    promise: s3.upload({ Bucket, Key, Body: pass, Metadata }).promise()
  };
};

const getMetadata = (snap) => {
  const durationSeconds = Math.ceil(snap.data().duration);
  return {
    'duration': `${durationSeconds}`
  }
}

exports.createHandler = async (admin, snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const destPath = "dpe/" + srcPath + ".wav"
  const readStream = bucket.file(srcPath).createReadStream();

  console.log("[START] Upload to S3");
  const metadata = getMetadata(snap);
  try {
    const { writeStream, promise } = uploadS3Stream({
      AWSConfig: aws,
      Key: destPath,
      Metadata: metadata
    });

    readStream.pipe(writeStream);
    await promise;

  } catch (err) {
    return console.error("[ERROR] Failed to upload to S3:", err);
  } 

  return console.log(`[COMPLETE] Finished upload to s3://${aws.bucket}/${destPath}`);
};
