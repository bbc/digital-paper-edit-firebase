// assume role of AWS and make request

const path = require("path");
const os = require("os");
const fs = require("fs");
const aws = require("aws");

exports.createHandler = async (admin, snap, bucketName, context) => {
  const { userId, itemId } = context.params;

  const srcPath = `users/${userId}/audio/${itemId}`;

  const upload = snap.data();
  const storage = admin.storage();
  const bucket = storage.bucket(bucketName);

  const readStream = bucket.file(srcPath).createReadStream();

  // assume role to AWS
  // aws.role = ""

  // submit job to PSTT
  // waiting for transcription
};
