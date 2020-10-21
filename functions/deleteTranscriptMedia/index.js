exports.createHandler = async (snap, context, admin) => {
  const defaultStorage = admin.storage();
  const deletedValue = snap.data();
  const storageRefPath = deletedValue.storageRefName;
  const bucket = defaultStorage.bucket();
  const file = bucket.file(storageRefPath);
  file.delete();

  const storageRefPathAudioPreview = deletedValue.audioUrl;
  const bucketForaudio = storageRefPathAudioPreview.bucket();
  const fileAudio = bucket.file(bucketForaudio);
  return fileAudio.delete();
};
