const { updateTranscription } = require('../sttChecker');

const isDeletableContentType = (contentType) => {
  return contentType ? contentType.includes('video') || contentType.includes('audio') : false;
};

const deleteExpiredFile = async (file, admin) => {
  await file.delete();
  const transcriptId = file.metadata.metadata.id;
  if (transcriptId) {
    await updateTranscription(admin, transcriptId, file.metadata.metadata.projectId, {
      status: 'expired',
      message: 'Media older than 60 days',
    });
  }
};

const checkForExpiredContent = async (allFiles, admin) => {
  const daysUntilExpiry = 60;
  let filePath = '';
  // eslint-disable-next-line consistent-return
  allFiles.forEach(async (file) => {
    try {
      const dateCreated = new Date(file.metadata.timeCreated);
      const expiryDate = new Date(dateCreated);
      expiryDate.setDate(dateCreated.getDate() + daysUntilExpiry);
      filePath = file.metadata.name;
      const transcriptFilePath = `projects/${ file.metadata.metadata.projectId }/transcripts/${ file.metadata.metadata.id }`;

      if (Date.now() >= expiryDate && isDeletableContentType(file.metadata.contentType)) {
        await deleteExpiredFile(file, admin);

        return console.log(`[IN PROGRESS] Expired media is being deleted:
        filePath: ${ filePath }
        transcriptFilePath: ${ transcriptFilePath }`);
      }
    } catch (error) {
      return console.log(`[ERROR]: Unable to delete file ${ filePath }: `, error);
    }
  });
};

const dpeCronExpiredMediaChecker = async (bucket, admin) => {
  console.log('[START] Checking for expired media files...');
  try {
    const allFiles = await bucket.getFiles();
    await checkForExpiredContent(allFiles[0], admin);

    return console.log('[COMPLETE] Deleted expired media content ✅');
  }
  catch (error) {
    return console.log(`[ERROR] Files could not be deleted ${ error }`);
  }
};

exports.createHandler = async (bucket, admin) => {
  await dpeCronExpiredMediaChecker(bucket, admin);
};