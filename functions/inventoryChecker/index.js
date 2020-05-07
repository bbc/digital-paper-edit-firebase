const { getUserCollection } = require("../utils/firebase");
const { getTranscriptsCollection } = require("../utils/firebase");
const deleteFirestore = async (admin, object) => {
  const { id: transcriptId, userId, folder } = object.metadata;
  console.log(
    `[START] Deleting item ${transcriptId} for user ${userId} in ${folder}`
  );

  try {
    await getUserCollection(admin, userId, folder).doc(transcriptId).delete();
    console.log(
      `[COMPLETE] Deleted item ${transcriptId} for user ${userId} in ${folder}`
    );
  } catch (e) {
    console.error(
      `[ERROR] Failed to delete item ${transcriptId} for user ${userId} in ${folder}: `,
      e
    );
  }
};

const getUserUpdate = (object) => {
  const { metadata, size, contentType, md5Hash, timeCreated, name } = object;
  const { originalName, duration, projectId } = metadata;

  return {
    originalName: originalName ? originalName : "",
    size: size,
    contentType: contentType,
    md5Hash: md5Hash,
    timeCreated: timeCreated,
    duration: duration ? duration : 0,
    ref: name,
    projectId: projectId
  };
};

const getTranscriptionUpdate = (object) => {
  const { name, contentType } = object;
  return {
    media: { type: contentType, ref: name },
  };
};

const updateUserWithFile = async (admin, userUpdate, id, userId, folder) => {
  try {
    console.log(
      `[START] Setting item ${id} for user ${userId} in ${folder} with: ${JSON.stringify(
        userUpdate
      )}`
    );
    await getUserCollection(admin, userId, folder).doc(id).set(userUpdate);
    console.log(`[COMPLETE] Set item ${id} for user ${userId} in ${folder}`);
  } catch (e) {
    console.error(
      `[ERROR] Failed to set item ${id} for user ${userId} in ${folder}: `,
      e
    );
  }
  return userUpdate;
};

const updateTranscription = async (admin, update, transcriptId, projectId) => {
  try {
    console.log(
      `[START] Updating transcription item ${transcriptId} in project ${projectId} with: ${JSON.stringify(
        update
      )}`
    );
    await getTranscriptsCollection(admin, projectId)
      .doc(transcriptId)
      .update(update);

    console.log(
      `[COMPLETE] Updating transcription item ${transcriptId} in project ${projectId}`
    );
  } catch (e) {
    console.error(
      `[ERROR] Failed transcription item ${transcriptId} in project ${projectId}:`,
      e
    );
  }
};

const updateFirestore = async (admin, object) => {
  const { id: transcriptId, userId, projectId, folder } = object.metadata;

  const userUpdate = getUserUpdate(object);
  await updateUserWithFile(admin, userUpdate, transcriptId, userId, folder);

  if (folder === "uploads") {
    const transcriptionUpdate = getTranscriptionUpdate(object);
    transcriptionUpdate.message = "Stripping audio...";
    await updateTranscription(
      admin,
      transcriptionUpdate,
      transcriptId,
      projectId
    );
  } else if (folder === "audio") {
    const transcriptionUpdate = {
      message: "Sending media to a Speech-to-text service...",
    };
    await updateTranscription(
      admin,
      transcriptionUpdate,
      transcriptId,
      projectId
    );
  }
};

exports.deleteHandler = async (admin, object) => {
  await deleteFirestore(admin, object);
};

exports.finalizeHandler = async (admin, object) => {
  await updateFirestore(admin, object);
};
