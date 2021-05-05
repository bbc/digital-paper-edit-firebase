const { info, error } = require("firebase-functions/lib/logger");
const { getUserCollection } = require("../utils/firebase");
const { getTranscriptsCollection } = require("../utils/firebase");

const deleteFirestore = async (admin, object) => {
  const { id: transcriptId, userId, projectId, folder } = object.metadata;
  const jobData = { id: transcriptId, userId, projectId};

  info(
    `[START] Deleting item ${transcriptId} for user ${userId} in ${folder}: `, jobData
  );

  try {
    await getUserCollection(admin, userId, folder).doc(transcriptId).delete();
    info(
      `[COMPLETE] Deleted item ${transcriptId} for user ${userId} in ${folder}: `, jobData
    );
  } catch (e) {
    error(
      `[ERROR] Failed to delete item ${transcriptId} for user ${userId} in ${folder}: `, jobData,
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

const updateUserWithFile = async (admin, userUpdate, id, userId, projectId, folder) => {
  const jobData = { id: transcriptId, userId, projectId };
  try {
    info(
      `[START] Setting item ${id} for user ${userId} in ${folder} with: ${JSON.stringify(
        userUpdate
      )}: `, jobData
    );
    await getUserCollection(admin, userId, folder).doc(id).set(userUpdate);
    info(`[COMPLETE] Set item ${id} for user ${userId} in ${folder}: `, jobData);
  } catch (e) {
    error(
      `[ERROR] Failed to set item ${id} for user ${userId} in ${folder}: `,
      { ...jobData, e}
    );
  }
  return userUpdate;
};

const updateTranscription = async (admin, update, transcriptId, projectId, userId) => {
  const jobData = { id: transcriptId, userId, projectId };
  try {
    info(
      `[START] Updating transcription item ${transcriptId} in project ${projectId} with: ${JSON.stringify(
        update
      )}: `, jobData
    );
    await getTranscriptsCollection(admin, projectId)
      .doc(transcriptId)
      .update(update);

    info(
      `[COMPLETE] Updating transcription item ${transcriptId} in project ${projectId}: `, jobData
    );
  } catch (e) {
    error(
      `[ERROR] Failed transcription item ${transcriptId} in project ${projectId}:`,
      { ...jobData, e}
    );
  }
};

const updateFirestore = async (admin, object) => {
  const { id: transcriptId, userId, projectId, folder } = object.metadata;

  const userUpdate = getUserUpdate(object);
  await updateUserWithFile(admin, userUpdate, transcriptId, userId, projectId, folder);

  if (folder === "uploads") {
    const transcriptionUpdate = getTranscriptionUpdate(object);
    transcriptionUpdate.message = "Stripping audio...";
    await updateTranscription(
      admin,
      transcriptionUpdate,
      transcriptId,
      projectId, 
      userId
    );
  } else if (folder === "audio") {
    const transcriptionUpdate = {
      message: "Sending media to a Speech-to-text service...",
    };
    await updateTranscription(
      admin,
      transcriptionUpdate,
      transcriptId,
      projectId,
      userId
    );
  }
};

exports.deleteHandler = async (admin, object) => {
  await deleteFirestore(admin, object);
};

exports.finalizeHandler = async (admin, object) => {
  await updateFirestore(admin, object);
};
