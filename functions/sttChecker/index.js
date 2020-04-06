const getProjectsCollection = async admin => {
  return await admin
    .firestore()
    .collection(`apps/digital-paper-edit/projects`)
    .get();
};

const getUsersCollection = async admin => {
  return await admin
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

const getAudioCollection = async (admin, userId) => {
  return await admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${userId}/audio`)
    .get();
};

const validateJob = (data, timestamp) => {
  // if updated date  || created date is too old return false
  console.log("validatingJob", data, timestamp.updated);
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

const something = (jointData, querySnapshot, timestamp) => {
  querySnapshot.forEach(transcript => {
    validateJob(timestamp, transcript.data());
    try {
      const userId = jointData[transcript.id]["user"];
      const objectKey = `dpe/users/${userId}/audio/${transcript.id}.wav`;
      const status = fetchStatus(objectKey);
    } catch (err) {
      console.error("some err");
    }
  });
};

const getTranscriptionOwners = async admin => {
  const usersCollection = await getUsersCollection(admin);
  // const audioCollection = await Promise.all(
  //   usersCollection.docs.map(user => getAudioCollection(admin, user.id))
  // );

  // console.log("audio", JSON.stringify(audioCollection.map(ac => ac.docs)));

  const asyncUpdate = async userId => {
    const audioCollection = await getAudioCollection(admin, userId);
    const audioIds = audioCollection.docs.map(audio => audio.id);
    const rest = Object.assign(
      {},
      ...Object.entries(audioIds).map(audioId => {
        return { [audioId]: { user: userId } };
      })
    );
    return rest;
  };

  const data = await Promise.all(
    usersCollection.docs.map(
      user => asyncUpdate(user.id)
      // const asyncUpdate = async userId => {
      //   const audioCollection = await getAudioCollection(admin, userId);
      //   return Object.assign(
      //     {},
      //     ...Object.entries(audioCollection.docs).map(audio => ({
      //       [audio.id]: { user: userId }
      //     }))
      //   );
      // };
      // const audioCollection = await getAudioCollection(admin, userId);
      // audioCollection.docs.forEach(audio => {
      //   jointData[audio.id] = userId;
      // });
      // console.log("test", JSON.stringify(jointData));
    )
  );

  // const exampleId = "gLoKESQNkVavUfSiqqoSEEEa6Lo2";
  // console.log(await asyncUpdate(exampleId));

  // const audioFiles = [];
  // const audioCollection = await getAudioCollection(admin, user.id);
  // let docs = audioCollection.docs.map(audio => audio);

  // usersCollection.forEach(async user => {
  //   userIds.push(user.id);
  //   const audioCollection = await getAudioCollection(admin, user.id);
  //   let docs = audioCollection.docs;
  //   console.log("audio", docs);
  //   audioCollection.forEach(audio => {
  //     audioFiles.push(audio.id);
  //     Object.assign(jointData, { [audio.id]: { user: user.id } });
  //     console.log("joindata updated");
  //   });
  //   console.log("audioFiles", audioFiles);
  // });
  // console.log("audioFiles", audioFiles);
  console.log("joint data at the end before return", JSON.stringify(data));
  return data;
};

const updateFirestore = async (admin, timestamp) => {
  console.log(`[START] Checking STT jobs for in-progress transcriptions`);
  try {
    const projectsCollection = await getProjectsCollection(admin);
    const jointData = await getTranscriptionOwners(admin);
    console.log("jointData", JSON.stringify(jointData));
    // await projectsCollection.forEach(
    //   async project =>
    //     await getTranscriptsInProgress(
    //       admin,
    //       project.id
    //     ).onSnapshot(querySnapshot =>
    //       something(jointData, querySnapshot, timestamp)
    //     )
    // );

    console.log(`[COMPLETE] Checking STT jobs for in-progress transcriptions`);
  } catch (e) {
    console.error(`[ERROR] Failed to get STT jobs status:`, e);
  }
};

exports.createHandler = async (admin, config, context) => {
  // const status = await getStatus(config)
  const timestamp = context.timestamp;
  await updateFirestore(admin, timestamp);
  return console.log();
};
