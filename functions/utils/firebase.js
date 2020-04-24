const getProjectsCollection = (admin) => {
  return admin.firestore().collection(`apps/digital-paper-edit/projects`);
};

const getUserCollection = (admin, uid, collection) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${uid}/${collection}`);
};

const getUsersCollection = (admin) => {
  return admin.firestore().collection(`apps/digital-paper-edit/users`);
};

const getTranscriptsCollection = (admin, projectId) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/projects/${projectId}/transcripts`);
};

const getTranscriptsInProgress = (admin, projectId) => {
  return getTranscriptsCollection(admin, projectId).where(
    "status",
    "==",
    "in-progress"
  );
};

const getAudioCollection = (admin, userId) => {
  return getUserCollection(admin, userId, "audio");
};

const getUserAudio = async (admin, userId) => {
  const audioCollection = await getAudioCollection(admin, userId).get();
  const audioIds = audioCollection.docs.map((audio) => audio.id);
  return Object.assign(
    {},
    ...Object.entries(audioIds).map(([index, audioId]) => ({
      [audioId]: { user: userId },
    }))
  );
};

const getUsersAudioData = async (admin) => {
  const usersCollection = await getUsersCollection(admin).get();
  const allUserAudioData = await Promise.all(
    usersCollection.docs.map((user) => getUserAudio(admin, user.id))
  );
  return Object.assign(
    {},
    ...Object.entries(allUserAudioData).map(([index, userData]) => userData)
  );
};

const getStorageSignedUrl = async (srcFile) => {
  try {
    console.log(`[START] Getting signed URL`);
    const sourceUrl = await srcFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 9, // 9 minutes
    });
    console.log(`[COMPLETE] Signed URL: ${sourceUrl}`);
    return sourceUrl;
  } catch (err) {
    console.error("[ERROR] Could not get signed URL: ", err);
    throw err;
  }
};

exports.getUsersAudioData = getUsersAudioData;
exports.getUserCollection = getUserCollection;
exports.getProjectsCollection = getProjectsCollection;
exports.getTranscriptsInProgress = getTranscriptsInProgress;
exports.getTranscriptsCollection = getTranscriptsCollection;
exports.getStorageSignedUrl = getStorageSignedUrl;
