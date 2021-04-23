const { updateTranscription } = require("../sttChecker");

const expiredMediaChecker = (bucket, admin) => {
  bucket.getFiles().then((data) => {
    const files = data[0];

    files.forEach((file) => {
      const dateCreated = new Date(file.metadata.timeCreated);

      let expiryDate = new Date(dateCreated);
      expiryDate.setDate(dateCreated.getDate() + 60);

      const isDeletableContentType = (contentType) => {
        let isDeletable = false;
        if (contentType !== undefined) {
          isDeletable = contentType.includes("video") || contentType.includes("audio");
        }
        return isDeletable;
      }

      if (
        Date.now() >= expiryDate &&
        isDeletableContentType(file.metadata.contentType)
        // && file.metadata.metadata.id === "zgBSIGwTvqJjlbto5nb2" // UNCOMMENT TO SAFELY TEST FILE DELETION/UPDATE TRANSCRIPTION STATUS
        ) {

        // file.delete();
        // updateTranscription(admin, file.metadata.metadata.id, file.metadata.metadata.projectId, {
        //   status: "expired",
        //   message: "Media older than 60 days",
        // });

        console.log(`Expired media was deleted:
          originalName: ${ file.metadata.metadata.originalName }
          timeCreated: ${ file.metadata.timeCreated }
          filePath: ${ file.metadata.name }
          id: ${ file.metadata.metadata.id }
          userId: ${ file.metadata.metadata.userId }
          projectId: ${ file.metadata.metadata.projectId }`);
      }
    })
    return;
  }).catch(error => {
    return console.log(`Files could not be retreived ${ error }`);
  })
}

exports.createHandler = async (bucket, admin) => {
  await expiredMediaChecker(bucket, admin);
};