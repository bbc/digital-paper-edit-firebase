//////////////////////////////////////////////////////////////////////////////
// exports.deleteTranscriptMediaForProject = functions.firestore.document('projects/{projectId}').onDelete(async (snap, context) => {
//   const defaultStorage = admin.storage();
//   const deletedValue = snap.data();
//   // iterate through projects transcripts to get the storageRef value
//   const storageRefPath = deletedValue.storageRefName;
//   const bucket = defaultStorage.bucket();
//   const file = bucket.file(storageRefPath);
//   return file.delete();
// });
