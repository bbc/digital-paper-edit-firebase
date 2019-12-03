const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const docRef = admin
  .firestore()
  .collection("apps")
  .doc("digital-paper-edit");

const BucketFunctions = functions.storage
  .bucket(functions.config().storage.bucket)
  .object();

const inventoryChecker = require("./inventoryChecker");

exports.onFinalize = BucketFunctions.onFinalize(obj =>
  inventoryChecker.finalizeHandler(obj, docRef)
);
exports.onDelete = BucketFunctions.onDelete(obj =>
  inventoryChecker.deleteHandler(obj, docRef)
);
