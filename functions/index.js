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

const maxRuntimeOpts = {
  timeoutSeconds: 540, // 9 minutes
  memory: "2GB"
};

exports.onCreateUpload = functions
  .runWith(maxRuntimeOpts)
  .firestore.document("apps/digital-paper-edit/users/{userId}/uploads/{itemId}")
  .onCreate((snap, context) =>
    audioStripper.createHandler(admin, snap, bucketName, context)
  );
