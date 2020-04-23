const AWS = require("aws-sdk");
const fetch = require("node-fetch");
const stream = require("stream");

const getSignedUrl = async (aws, params) => {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3({
      region: aws.region,
      accessKeyId: aws.key,
      secretAccessKey: aws.secret,
    });
    s3.getSignedUrl("putObject", params, (err, url) => {
    if (err) {
      console.log("[ERROR] Error getting signed url", err);
      reject(err)
    }

    console.log("[SUCCESS] Signed url received:", url);
    resolve(url);
    })
  });
}
  
const uploadS3Stream = (url, stream, size) => {
  const params = {
    method: 'PUT',
    body: stream,
    headers: {
      "Content-length": size,
    },
  }

  return promise = fetch(url, params)
    .then(res => {
      if (res.ok) {
        return console.log(
          `[SUCCESS] File upload PUT request sent with status ${res.status}`
        );
      } else {
        throw new Error(
          `[ERROR] Error uploading file to S3: ${res.status} - ${res.statusText}`
        );
      }
     });
}

exports.getSignedUrl = getSignedUrl;
exports.uploadS3Stream = uploadS3Stream;  