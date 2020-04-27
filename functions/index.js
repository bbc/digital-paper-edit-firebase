const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const inventoryChecker = require("./inventoryChecker");
const audioStripper = require("./audioStripper");
const awsUploader = require("./awsUploader");
const sttChecker = require("./sttChecker");

const config = functions.config();

const bucketName = config.storage.bucket;
const bucketTrigger = functions.storage.bucket(bucketName).object();
const bucket = admin.storage().bucket(bucketName);

exports.onFinalizeBucketObjUpdateFirestore = bucketTrigger.onFinalize((obj) =>
  inventoryChecker.finalizeHandler(admin, obj)
);

exports.onDeleteBucketObjUpdateFirestore = bucketTrigger.onDelete((obj) =>
  inventoryChecker.deleteHandler(admin, obj)
);

exports.onCreateAudioFirestoreUploadToAWS = functions.firestore
  .document("apps/digital-paper-edit/users/{userId}/audio/{itemId}")
  .onCreate((snap, context) =>
    awsUploader.createHandler(snap, bucket, config.aws.bucket, context)
  );

const maxRuntimeOpts = {
  timeoutSeconds: 540, // 9 minutes
  memory: "2GB",
};

exports.onCreateFirestoreUploadStripAndUploadAudio = functions
  .runWith(maxRuntimeOpts)
  .firestore.document("apps/digital-paper-edit/users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) =>
    audioStripper.createHandler(snap, bucket, context)
  );

const runSchedule = config.aws.api.schedule || "every 60 minutes";

exports.cronSTTJobChecker = functions.pubsub
  .schedule(runSchedule)
  .onRun((context) => sttChecker.createHandler(admin, config.aws.api, context));
