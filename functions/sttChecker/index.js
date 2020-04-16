const fetch = require("node-fetch");
const { secondsToDhms } = require("../utils");

const {
  getUsersAudioData,
  getProjectsCollection,
  getTranscriptsCollection,
  getTranscriptsInProgress,
} = require("../utils/firebase");

const psttAdapter = require("./psttAdapter");

const isExpired = (sttCheckerExecTime, lastUpdatedTime) => {
  const ONE_DAY_IN_NANOSECONDS = 3600 * 24 * 1000;
  const timeDifference = sttCheckerExecTime - lastUpdatedTime;
  console.debug(`Last updated ${secondsToDhms(timeDifference / 1000)} ago`);
  return timeDifference >= ONE_DAY_IN_NANOSECONDS;
};

const isValidJob = (execTimestamp, transcript) => {
  const transcriptData = transcript.data();
  const sttCheckerExecTime = Date.parse(execTimestamp);
  const lastUpdatedTime = transcriptData.updated.toDate().getTime();

  if (isExpired(sttCheckerExecTime, lastUpdatedTime)) {
    return false;
  }
  return true;
};

const filterValidJobs = (transcripts, execTimestamp) =>
  transcripts.filter((transcript) => isValidJob(execTimestamp, transcript));

const filterInvalidJobs = (transcripts, execTimestamp) =>
  transcripts.filter((transcript) => !isValidJob(execTimestamp, transcript));

const getJobStatus = async (objectKey, config) =>
  await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.key,
    },
    body: JSON.stringify({
      objectKey: objectKey,
    }),
  });

const getProjectTranscripts = async (admin, execTimestamp) => {
  const projectsCollection = await getProjectsCollection(admin).get();
  const projects = projectsCollection.docs;
  const projectTranscripts = await Promise.all(
    projects.map(
      async (project) => await getTranscriptsInProgress(admin, project.id).get()
    )
  );
  return projectTranscripts;
};

const updateTranscription = async (admin, transcriptId, projectId, update) => {
  const docRef = getTranscriptsCollection(admin, projectId).doc(transcriptId);
  await docRef.update(update);
};

const updateTranscriptsStatus = async (
  admin,
  projectTranscripts,
  usersAudioData,
  execTimestamp,
  config
) => {
  console.log(projectTranscripts);
  await filterInvalidJobs(projectTranscripts, execTimestamp).forEach(
    async (job) => {
      console.debug(`Job ${job.id} expired, updating status to Error`);
      const { projectId } = job.data();
      await updateTranscription(admin, job.id, projectId, { status: "error" });
    }
  );

  let validJobs = filterValidJobs(projectTranscripts, execTimestamp);

  await validJobs.forEach(async (job) => {
    let status = "";
    let responseData = {};
    const { projectId } = job.data();

    const userId = usersAudioData[job.id]["user"];
    const objectKey = `dpe/users/${userId}/audio/${job.id}.wav`;

    try {
      const response = await getJobStatus(objectKey, config);
      if (response.status < 400) {
        responseData = await response.json();
        status = responseData.status.toLowerCase();
        transcript = responseData.transcript;
      } else {
        console.error(`[ERROR] Status code ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to get STT jobs status:`, err);
    }

    if (status === "in-progress") {
      return;
    }

    const update = { status: status };

    if (status === "success") {
      const { words, paragraphs } = psttAdapter(responseData.transcript.items);
      update.words = words;
      update.paragraphs = paragraphs;
      update.status = "done";
    }

    await updateTranscription(admin, job.id, projectId, update);
    console.debug(`Updated ${job.id} with data`, update);
  });
};

const sttCheckRunner = async (admin, config, execTimestamp) => {
  console.log(`[START] Checking STT jobs for in-progress transcriptions`);
  let usersAudioData = {};

  try {
    usersAudioData = await getUsersAudioData(admin);
  } catch (err) {
    return console.error("[ERROR] Could not get User's Audio Data", err);
  }

  try {
    const projectTranscripts = await getProjectTranscripts(
      admin,
      execTimestamp
    );
    projectTranscripts
      .forEach(async (transcripts) => {
        const transcriptDocs = transcripts.docs;
        if (transcriptDocs.length > 0) {
          await updateTranscriptsStatus(
            transcriptDocs,
            usersAudioData,
            execTimestamp,
            config
          );
        }
      });
  } catch (err) {
    return console.error("[ERROR] Could not get valid Jobs", err);
  }

  return console.log(`[COMPLETE] Checking STT jobs for in-progress transcriptions`);
};

exports.createHandler = async (admin, config, context) => {
  await sttCheckRunner(admin, config, context.timestamp);
};