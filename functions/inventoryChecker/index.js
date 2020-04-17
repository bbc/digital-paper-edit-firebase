const getTranscriptsCollection = (admin, projectId) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/projects/${projectId}/transcripts`);
};

const getUserCollection = (admin, uid, collection) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${uid}/${collection}`);
};

const deleteFirestore = async (admin, object) => {
  const { id, userId, folder } = object.metadata;
  console.log(`[START] Deleting item ${id} for user ${userId} in ${folder}`);

  try {
    await getUserCollection(admin, userId, folder).doc(id).delete();
    console.log(
      `[COMPLETE] Deleted item ${id} for user ${userId} in ${folder}`
    );
  } catch (e) {
    console.error(
      `[ERROR] Failed to delete item ${id} for user ${userId} in ${folder}: `,
      e
    );
  }
};

const updateFirestore = async (admin, object) => {
  const {
    metadata,
    size,
    contentType,
    md5Hash,
    timeCreated,
    selfLink,
  } = object;

  const { id, userId, projectId, folder, originalName, duration } = metadata;

  const userUpdate = {
    originalName: originalName ? originalName : "",
    size: size,
    contentType: contentType,
    md5Hash: md5Hash,
    timeCreated: timeCreated,
    duration: duration ? duration : 0,
    selfLink: selfLink,
  };

  const mediaType = contentType.split("/")[0];

  const transcriptionUpdate = { media: { type: mediaType, url: selfLink } };

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

  try {
    console.log(
      `[START] Updating transcription item ${id} in project ${projectId} with: ${JSON.stringify(
        transcriptionUpdate
      )}`
    );
    await getTranscriptsCollection(admin, projectId)
      .doc(id)
      .update(transcriptionUpdate);
    console.log(
      `[COMPLETE] Updating transcription item ${id} in project ${projectId}`
    );
  } catch (e) {
    console.error(
      `[ERROR] Failed transcription item ${id} in project ${projectId}:`,
      e
    );
  }
};

exports.deleteHandler = async (object, admin) => {
  await deleteFirestore(admin, object);
};

exports.finalizeHandler = async (object, admin) => {
  await updateFirestore(admin, object);
};
