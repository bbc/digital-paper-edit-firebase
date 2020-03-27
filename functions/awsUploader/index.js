const AWS = require("aws-sdk");
const stream = require("stream");

const uploadS3Stream = ({ AWSConfig, Key }) => {
  const Bucket = AWSConfig.bucket;
  const s3 = new AWS.S3({
    region: AWSConfig.region,
    accessKeyId: AWSConfig.key,
    secretAccessKey: AWSConfig.secret
  });
  const pass = new stream.PassThrough();
  // const metadata = {
  //   'duration': 60, // figure this out
  // }

  return {
    writeStream: pass,
    uploadPromise: s3.upload({ Bucket, Key, Body: pass }).promise()
  };
};

exports.createHandler = async (admin, snap, bucket, aws, context) => {
  const { userId, itemId } = context.params;
  const srcPath = `users/${userId}/audio/${itemId}`;
  const destPath = "dpe/" + srcPath + ".wav"
  const readStream = bucket.file(srcPath).createReadStream();

  console.log("[START] Upload to S3");

  try {
    const { writeStream, uploadPromise } = uploadS3Stream({
      AWSConfig: aws,
      Key: destPath
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
