const getProjectsCollection = admin => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/projects`)
    .get();
};

const getUsersCollection = admin => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users`)
    .get();
};

const getTranscriptsInProgress = (admin, projectId) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/projects/${projectId}/transcripts`)
    .where("status", "==", "in-progress");
};

const getAudioCollection = (admin, userId) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${userId}/audio`)
    .get();
};

function secondsToDhms(seconds) {
seconds = Number(seconds);
var d = Math.floor(seconds / (3600*24));
var h = Math.floor(seconds % (3600*24) / 3600);
var m = Math.floor(seconds % 3600 / 60);
var s = Math.floor(seconds % 60);

var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
return dDisplay + hDisplay + mDisplay + sDisplay;
}

const validateJob = (handlerRunDate, jobData) => {
  // if updated date  || created date is too old return false
  const updatedTime = jobData.updated.toDate()
  console.log(handlerRunDate, updatedTime)
  const timeDifference = handlerRunDate - updatedTime
  console.log(timeDifference)
  console.log(secondsToDhms(timeDifference))
  return true;
};

const fetchStatus = async objectKey => {
  console.log("objectKey", objectKey);
  const body = {
    objectKey: objectKey
    // "dpe/users/gLoKESQNkVavUfSiqqoSEEEa6Lo2/audio/1ipL5m7V7Jal7h3x3Odu.wav"
  };
};

const updateStatus = status => {};

const something = (userData, querySnapshot, handlerCalledTimestamp) => {
  querySnapshot.forEach(transcript => {
    validateJob(handlerCalledTimestamp, transcript.data());
    try {
      const userId = userData[transcript.id]["user"];
      const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
      const status = fetchStatus(objectKey);
    } catch (err) {
      console.error("some err");
    }
  });
};

const getUserAudio = async (admin,userId) => {
  const audioCollection = await getAudioCollection(admin, userId);
  const audioIds = audioCollection.docs.map(audio => audio.id);
  return Object.assign(
    {},
    ...Object.entries(audioIds).map(([index, audioId]) => 
    ({[audioId]: { user: userId }})
    )
  );
};

const getUsersAudioData = async admin => {
  const usersCollection = await getUsersCollection(admin);
  const allUserAudioData = await Promise.all(
    usersCollection.docs.map(
      user => getUserAudio(admin, user.id)
    )
  );
  return Object.assign({},
    ...Object.entries(allUserAudioData).map(([index, userData]) => userData));
};

const updateFirestore = async (admin, handlerCalledTimestamp) => {
  console.log(`[START] Checking STT jobs for in-progress transcriptions`);
  try {
    const projectsCollection = await getProjectsCollection(admin);
    const usersAudioData = await getUsersAudioData(admin);

    await projectsCollection.forEach(
      async project =>
        await getTranscriptsInProgress(
          admin,
          project.id
        ).onSnapshot(querySnapshot =>
          something(usersAudioData, querySnapshot, handlerCalledTimestamp)
        )
    );

    console.log(`[COMPLETE] Checking STT jobs for in-progress transcriptions`);
  } catch (e) {
    console.error(`[ERROR] Failed to get STT jobs status:`, e);
  }
};

exports.createHandler = async (admin, config, context) => {
  // const status = await getStatus(config)
  console.log("context timestamp", context.timestamp)
  const handlerRunDate = Date.parse(context.timestamp);
  await updateFirestore(admin, handlerRunDate);
  return console.log();
};
