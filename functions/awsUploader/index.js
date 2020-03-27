const AWS = require("aws-sdk");
const stream = require("stream");
const { getAudioDurationInSeconds } = require('get-audio-duration')

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
    uploadPromise: s3.upload({ Bucket, Key, Body: pass, Metadata }).promise()
  };
};

exports.createHandler = async (admin, snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const destPath = "dpe/" + srcPath + ".wav"
  const readStream = bucket.file(srcPath).createReadStream();
  let duration = 0;

  console.log("[START] Calculate audio duration");
  try {
    duration = await getAudioDurationInSeconds(readStream);
    console.log(`[COMPLETE] Successfully calculated duration: ${duration}`);
  } catch (err) {
    console.error(`[ERROR] Failed to compute duration of ${srcPath}:`, err);
  }

  console.log("[START] Upload to S3");
  try {
    const metadata = {
      'duration': duration
    }
    const { writeStream, uploadPromise } = uploadS3Stream({
      AWSConfig: aws,
      Key: destPath,
      Metadata: metadata
    });

    readStream.pipe(writeStream);
    await uploadPromise;

  } catch (err) {
    return console.error("[ERROR] Failed to upload to S3:", err);
  } 

  return console.log(
    `[COMPLETE] Finished upload to s3://${aws.bucket}/${destPath}`
  );
};
