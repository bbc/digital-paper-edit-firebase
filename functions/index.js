const functions = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

const bucketName = functions.config().storage.bucket;
const bucketTrigger = functions.storage.bucket(bucketName).object();

const inventoryChecker = require("./inventoryChecker");
const audioStripper = require("./audioStripper");

exports.onFinalize = bucketTrigger.onFinalize(obj =>
  inventoryChecker.finalizeHandler(obj, admin)
);

exports.onDelete = bucketTrigger.onDelete(obj =>
  inventoryChecker.deleteHandler(obj, admin)
);

exports.onCreateUpload = functions.firestore
  .document("users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) => {
    const bucket = admin.storage().bucket(bucketName);
    const storage = admin.storage;
    audioStripper.createHandler(storage, bucket, snap, context);
  });
