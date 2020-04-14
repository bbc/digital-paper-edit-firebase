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
    .where("status", "==", "in-progress")
    .get();
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

const getStatus = (objectKey, config) => {
  return fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.key,
    },
    body: JSON.stringify({
      objectKey: objectKey,
    }),
  });
  // console.log(JSON.stringify(response));
};

const updateStatus = (status) => {};

const getValidJobs = (transcripts, execTimestamp) =>
  transcripts.filter((transcript) => validJob(execTimestamp, transcript));

// transcripts.forEach((transcript) => {
//   try {
//     const userId = userData[transcript.id]["user"];
//     const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
//     const status = getStatus(objectKey, config);
//   } catch (err) {
//     console.error("some err");
//   }
// });
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
    const projects = projectsCollection.docs;
    const projectTranscripts = await Promise.all(
      projects.map(
        async (project) => await getTranscriptsInProgress(admin, project.id)
      )
    );

    projectTranscripts.forEach((transcripts) => {
      const validJobs = getValidJobs(transcripts.docs, execTimestamp);
      validJobs.forEach((transcript) => {
        console.log("transcript", transcript);
        try {
          const userId = userData[transcript.id]["user"];
          const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
          console.log(objectKey);
          // const status = getStatus(objectKey, config);
        } catch (err) {
          console.error("some err");
        }
      });
    });

    await projectsCollection.forEach(
      async (project) =>
        await getTranscriptsInProgress(admin, project.id).onSnapshot(
          (transcripts) => {
            const validJobs = getValidJobs(
              transcripts,
              usersAudioData,
              execTimestamp,
              config
            );
            // console.log("validJobs", JSON.stringify(validJobs));
            validJobs.forEach((transcript) => {
              try {
                const userId = userData[transcript.id]["user"];
                const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
                const status = getStatus(objectKey, config);
              } catch (err) {
                console.error("some err");
              }
            });
          }
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
