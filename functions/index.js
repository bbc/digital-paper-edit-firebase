const firebase = require("./Firebase");
const functions = require("firebase-functions");

const BucketFunctions = functions.storage
  .bucket(firebase.functionsConfig.storage.bucket)
  .object();

const inventoryChecker = require("./inventoryChecker");
const audioStripper = require("./audioStripper");

exports.onFinalize = BucketFunctions.onFinalize(obj =>
  inventoryChecker.finalizeHandler(obj, firebase)
);

exports.onDelete = BucketFunctions.onDelete(obj =>
  inventoryChecker.deleteHandler(obj, firebase)
);

exports.onCreateUpload = functions.firestore
  .document("users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) => {
    audioStripper.createHandler(snap, context);
  });
