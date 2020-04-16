const getUrl = async (srcFile) => {
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

const secondsToDhms = (seconds) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

const getProjectsCollection = (admin) => {
  return admin.firestore().collection(`apps/digital-paper-edit/projects`);
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
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${userId}/audio`);
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

exports.getUsersAudioData = getUsersAudioData;
exports.getProjectsCollection = getProjectsCollection;
exports.getTranscriptsInProgress = getTranscriptsInProgress;
exports.getTranscriptsCollection = getTranscriptsCollection;

exports.getUrl = getUrl;
exports.secondsToDhms = secondsToDhms;
