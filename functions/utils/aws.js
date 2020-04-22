const getSignedUrl = async (params) => {
  return new Promise((resolve, reject) => {
      s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) {
          console.log("err", err);
          reject(err)
      }

      console.log("url", url);
      resolve(url);
      })
  });
}
  
const uploadS3Stream = (url) => {
  const params = {
    method: 'PUT',
    body: stream,
  }
  const pass = new stream.PassThrough();

  const promise = fetch(url, params);

  return {
    writeStream: pass,
    promise: promise,
  }
}

exports.getSignedUrl = getSignedUrl;
exports.uploadS3Stream = uploadS3Stream;