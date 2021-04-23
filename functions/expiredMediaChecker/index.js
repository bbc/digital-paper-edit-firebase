const { updateTranscription } = require("../sttChecker");

const expiredMediaChecker = (bucket, admin) => {
  bucket.getFiles().then((data) => {
    const files = data[0];
    files.forEach((file) => {
      const dateCreated = new Date(file.metadata.timeCreated);
      let expiryDate = new Date(dateCreated);
      expiryDate.setDate(dateCreated.getDate() + 60);
      const isDeletableContentType = (contentType) => {
        if (contentType !== undefined) {
          if (contentType.includes("video") || contentType.includes("audio")) {
            return true;
          }
        }
        return false;
      }
      if (
        Date.now() >= expiryDate &&
        isDeletableContentType(file.metadata.contentType)) {
        file.delete();
        updateTranscription(admin, file.metadata.metadata.id, file.metadata.metadata.projectId, {
          status: "expired",
          message: "Media older than 60 days",
        });

        console.log(`Expired media was deleted:
          userId: ${ file.metadata.metadata.userId }
          id: ${ file.metadata.metadata.id }
          projectId: ${ file.metadata.metadata.projectId }
          originalName: ${ file.metadata.metadata.originalName }
          folder: ${ file.metadata.metadata.folder }`);
      }
    })
    return null;
  }).catch(error => {
    console.log(`Files could not be retreived ${ error }`);
  })
}

exports.createHandler = async (bucket, admin) => {
  await expiredMediaChecker(bucket, admin);
};