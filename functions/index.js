const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const inventoryChecker = require("./inventoryChecker");
const audioStripper = require("./audioStripper");
const awsUploader = require("./awsUploader");
const sttChecker = require("./sttChecker");

// Was run as a migration task
// const compressData = require("./compressData")

const config = functions.config();

const bucketName = config.storage.bucket;
const bucketTrigger = functions.storage.bucket(bucketName).object();
const bucket = admin.storage().bucket(bucketName);

exports.dpeOnFinalizeBucketObjUpdateFirestore = bucketTrigger.onFinalize((obj) =>
  inventoryChecker.finalizeHandler(admin, obj)
);

exports.dpeOnDeleteBucketObjUpdateFirestore = bucketTrigger.onDelete((obj) =>
  inventoryChecker.deleteHandler(admin, obj)
);

const maxRuntimeOpts = {
  timeoutSeconds: 540, // 9 minutes
  memory: "2GB",
};

exports.dpeOnCreateAudioFirestoreUploadToAWS = functions
  .runWith(maxRuntimeOpts)
  .firestore.document("apps/digital-paper-edit/users/{userId}/audio/{itemId}")
  .onCreate((snap, context) =>
    awsUploader.createHandler(snap, bucket, config.aws, context)
  );

exports.dpeOnCreateFirestoreUploadStripAndUploadAudio = functions
  .runWith(maxRuntimeOpts)
  .firestore.document("apps/digital-paper-edit/users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) =>
    audioStripper.createHandler(admin, snap, bucket, context)
  );

const runSchedule = config.aws.api.transcriber.schedule || "every 60 minutes";

exports.dpeCronSTTJobChecker = functions
  .runWith(maxRuntimeOpts)
  .pubsub.schedule(runSchedule)
  .onRun((context) =>
    sttChecker.createHandler(admin, config.aws.api.transcriber, context)
  );

// For migration of DB

//  exports.compressToGrouped = functions
//  .runWith(maxRuntimeOpts)
//  .pubsub.schedule("every 24 hours")
//  .onRun(() =>
//    compressData.createHandler(admin)
//  );
