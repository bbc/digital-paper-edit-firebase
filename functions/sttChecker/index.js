const secondsToDhms = require("../utils").secondsToDhms;

const getProjectsCollection = (admin) => {
  return admin.firestore().collection(`apps/digital-paper-edit/projects`).get();
};

const getUsersCollection = (admin) => {
  return admin.firestore().collection(`apps/digital-paper-edit/users`).get();
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

const isExpired = (sttCheckerExecTime, lastUpdatedTime) => {
  const ONE_DAY_IN_NANOSECONDS = 3600 * 24 * 1000;
  const timeDifference = sttCheckerExecTime - lastUpdatedTime;
  console.log(`Job last updated ${secondsToDhms(timeDifference / 1000)} ago`);
  return timeDifference >= ONE_DAY_IN_NANOSECONDS;
};

const validJob = (execTimestamp, transcript) => {
  const transcriptData = transcript.data();
  const sttCheckerExecTime = Date.parse(execTimestamp);
  const lastUpdatedTime = transcriptData.updated.toDate().getTime();
  if (isExpired(sttCheckerExecTime, lastUpdatedTime)) {
    console.log(`Job expired, updating status of ${transcript.id} to Error`);
    return false;
  }
  return true;
};

const getStatus = async (objectKey, config) => {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.key,
    },
    body: JSON.stringify({
      objectKey: objectKey,
    }),
  });
  console.log(JSON.stringify(response));
};

const updateStatus = (status) => {};

const getValidJobs = (querySnapshot, userData, execTimestamp, config) => {
  const validJobs = [];
  querySnapshot.forEach((transcript) => {
    if (validJob(execTimestamp, transcript)) {
      validJobs.push(transcript);
    }
  });

  console.log(JSON.stringify(validJobs));

  querySnapshot.forEach((transcript) => {
    if (validJob(execTimestamp, transcript)) {
      try {
        const userId = userData[transcript.id]["user"];
        const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
        const status = getStatus(objectKey, config);
      } catch (err) {
        console.error("some err");
      }
    }
  });
  // querySnapshot.forEach((transcript) => {
  //   if (validJob(execTimestamp, transcript)) {
  //     try {
  //       const userId = userData[transcript.id]["user"];
  //       const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
  //       const status = getStatus(objectKey, config);
  //     } catch (err) {
  //       console.error("some err");
  //     }
  //   }
  // });
};

const getUserAudio = async (admin, userId) => {
  const audioCollection = await getAudioCollection(admin, userId);
  const audioIds = audioCollection.docs.map((audio) => audio.id);
  return Object.assign(
    {},
    ...Object.entries(audioIds).map(([index, audioId]) => ({
      [audioId]: { user: userId },
    }))
  );
};

const getUsersAudioData = async (admin) => {
  const usersCollection = await getUsersCollection(admin);
  const allUserAudioData = await Promise.all(
    usersCollection.docs.map((user) => getUserAudio(admin, user.id))
  );
  return Object.assign(
    {},
    ...Object.entries(allUserAudioData).map(([index, userData]) => userData)
  );
};

const updateFirestore = async (admin, config, execTimestamp) => {
  console.log(`[START] Checking STT jobs for in-progress transcriptions`);
  try {
    const projectsCollection = await getProjectsCollection(admin);
    const usersAudioData = await getUsersAudioData(admin);

    await projectsCollection.forEach(
      async (project) =>
        await getTranscriptsInProgress(
          admin,
          project.id
        ).onSnapshot((querySnapshot) =>
          getValidJobs(querySnapshot, usersAudioData, execTimestamp, config)
        )
    );

    console.log(`[COMPLETE] Checking STT jobs for in-progress transcriptions`);
  } catch (e) {
    console.error(`[ERROR] Failed to get STT jobs status:`, e);
  }
};

exports.createHandler = async (admin, config, context) => {
  await updateFirestore(admin, config, context.timestamp);
  return console.log();
};
