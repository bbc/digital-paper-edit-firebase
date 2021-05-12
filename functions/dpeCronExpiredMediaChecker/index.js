const { updateTranscription } = require('../sttChecker');
const functions = require("firebase-functions");

const daysUntilExpiry = 60;

const isDeletableContentType = (contentType) => {
  return contentType ? contentType.includes('video') || contentType.includes('audio') : false;
};

const deleteExpiredFile = async (file, admin) => {
  await file.delete();
  const transcriptId = file.metadata.metadata.id;
  if (transcriptId) {
    await updateTranscription(admin, transcriptId, file.metadata.metadata.projectId, {
      status: 'expired',
      message: `Media older than ${ daysUntilExpiry } days`,
    });
  }
};

const checkForExpiredContent = async (allFiles, admin) => {
  let filePath = '';
  let transcriptFilePath = '';

  const expiredMediaFiles = allFiles.map(async (file) => {
    try {
      const dateCreated = new Date(file.metadata.timeCreated);
      const expiryDate = new Date(dateCreated);
      expiryDate.setDate(dateCreated.getDate() + daysUntilExpiry);
      filePath = file.metadata.name;
      transcriptFilePath = file.metadata.metadata ? `projects/${ file.metadata.metadata.projectId }/transcripts/${ file.metadata.metadata.id }` : 'no transcript';

      if (Date.now() >= expiryDate && isDeletableContentType(file.metadata.contentType)) {

        functions.logger.log(`[IN PROGRESS] Expired media is being deleted:
        filePath: ${ filePath }
        transcriptFilePath: ${ transcriptFilePath }`);
        return deleteExpiredFile(file, admin);
      }
      return Promise.resolve();
    } catch (error) {
      functions.logger.log(`[ERROR]: Unable to delete file ${ filePath } : `, error);
      return Promise.reject(error);
    }
  });

  return expiredMediaFiles;
};

const dpeCronExpiredMediaChecker = async (bucket, admin) => {
  functions.logger.log('[START] Checking for expired media files...');
  let data = [];
  let allFiles = [];

  try {
    data = await bucket.getFiles();
  } catch (error) {
    functions.logger.log(`[ERROR] data not found`, error);
    return error;
  }
  allFiles = data.length > 0 ? data[0] : [];

  try {
    const expiredContent = checkForExpiredContent(allFiles, admin);
    if (expiredContent.length > 0) {
      await Promise.all(expiredContent);
    }
    functions.logger.log('[COMPLETE] Deleted expired media content ✅');
  }
  catch (error) {
    functions.logger.log(`[ERROR] Files could not be deleted`, error );
    return error;
  }
  return true;
};

exports.createHandler = async (bucket, admin) => {
  await dpeCronExpiredMediaChecker(bucket, admin);
};