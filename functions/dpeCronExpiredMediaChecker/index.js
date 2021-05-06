const { updateTranscription } = require('../sttChecker');

const isDeletableContentType = (contentType) => {
  return contentType ? contentType.includes('video') || contentType.includes('audio') : false;
};

const deleteExpiredFile = async (file, admin) => {
  await file.delete();
  await updateTranscription(admin, file.metadata.metadata.id, file.metadata.metadata.projectId, {
    status: 'expired',
    message: 'Media older than 60 days',
  });
};

const checkForExpiredContent = async (allFiles, admin) => {
  // eslint-disable-next-line consistent-return
  allFiles.forEach(async (file) => {
    try {
      const dateCreated = new Date(file.metadata.timeCreated);
      const expiryDate = new Date(dateCreated);
      expiryDate.setDate(dateCreated.getDate() + 60);

      if (Date.now() >= expiryDate && isDeletableContentType(file.metadata.contentType)) {
        await deleteExpiredFile(file, admin);

        return console.log(`[IN PROGRESS] Expired media was deleted:
            originalName: ${ file.metadata.metadata.originalName }
            timeCreated: ${ file.metadata.timeCreated }
            filePath: ${ file.metadata.name }
            id: ${ file.metadata.metadata.id }
            userId: ${ file.metadata.metadata.userId }
            projectId: ${ file.metadata.metadata.projectId }`);
      }
      else {
        return console.log(`[IN PROGRESS] Ignoring media - not expired:
            originalName: ${ file.metadata.metadata.originalName }
            timeCreated: ${ file.metadata.timeCreated }
            filePath: ${ file.metadata.name }
            id: ${ file.metadata.metadata.id }
            userId: ${ file.metadata.metadata.userId }
            projectId: ${ file.metadata.metadata.projectId }`);
      }
    } catch {(error) => {
      return console.log(`[ERROR]: Unable to delete file ${ file.metadata.metadata.originalName ? file.metadata.metadata.originalName : '' }: `, error);
    };}
  });};

const dpeCronExpiredMediaChecker = async (bucket, admin) => {
  console.log('[START] Checking for expired media files...');
  try {
    const allFiles = await bucket.getFiles();
    await checkForExpiredContent(allFiles[0], admin);
  }
  catch {(error => {
    return console.log(`[ERROR] Files could not be deleted ${ error }`);
  });

  }

  return console.log('[COMPLETE] Deleted expired media content');
};

exports.createHandler = async (bucket, admin) => {
  await dpeCronExpiredMediaChecker(bucket, admin);
};