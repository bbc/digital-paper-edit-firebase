const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const inventoryChecker = require("./inventoryChecker");
const audioStripper = require("./audioStripper");
const awsUploader = require("./awsUploader");

const config = functions.config();

const bucketName = config.storage.bucket;
const bucketTrigger = functions.storage.bucket(bucketName).object();
const bucket = admin.storage().bucket(bucketName);

exports.onFinalizeBucketObjUpdateFirestore = bucketTrigger.onFinalize(obj =>
  inventoryChecker.finalizeHandler(obj, admin)
);

exports.onDeleteBucketObjUpdateFirestore = bucketTrigger.onDelete(obj =>
  inventoryChecker.deleteHandler(obj, admin)
);

exports.onCreateAudioFirestoreUploadToAWS = functions.firestore
  .document("apps/digital-paper-edit/users/{userId}/audio/{itemId}")
  .onCreate((snap, context) => {
    return awsUploader.createHandler(admin, snap, bucket, config.aws, context);
  });

const maxRuntimeOpts = {
  timeoutSeconds: 540, // 9 minutes
  memory: "2GB",
};

exports.onCreateFirestoreUploadStripAndUploadAudio = functions
  .runWith(maxRuntimeOpts)
  .firestore.document("apps/digital-paper-edit/users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) => {
    return audioStripper.createHandler(snap, bucket, context)
  });
