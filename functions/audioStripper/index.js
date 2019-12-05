const { convertToAudio } = require("@bbc/convert-to-audio");

const cleanUp = files => {
  files.forEach(f => fs.unlinkSync(f));
};

const handleNewUpload = async (destPath, object, firebase) => {
  let tmpSrcPath;

  try {
    tmpSrcPath = await firebase.downloadFile(id, object.name);
  } catch (err) {
    console.error(`Failed to download file ${object.name}: `, err);
    return;
  }

  const tmpAudioPath = path.join(os.tmpdir(), `${name}.wav`);

  try {
    await convertToAudio(tmpSrcPath, tmpAudioPath);
  } catch (err) {
    console.error(`Failed to convert file ${object.name} to audio: `, err);
  }

  try {
    await firebase.uploadFile(destPath, tmpAudioPath, {
      customMetadata: metadata,
      contentType: "audio/wav"
    });
  } catch (err) {
    console.error(`Failed to upload audio file at ${destPath}: `, err);
  }

  cleanUp([tmpAudioPath, tmpSrcPath]);
};

exports.createHandler = async (snap, context) => {
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  const uploadedItem = snap.data();
  console.log(uploadedItem);
  console.log(context);
  const { userId, itemId } = context.params;
  const destPath = `users/${userId}/audio/${itemId}`;
  // context.params.userId == "marie"

  // await handleNewUpload(destPath, uploadedItem, firebase);
};
