const fetch = require("node-fetch");
const secondsToDhms = require("../utils").secondsToDhms;
const getUsersAudioData = require("../utils").getUsersAudioData;
const getProjectsCollection = require("../utils").getProjectsCollection;
const getTranscriptsInProgress = require("../utils").getTranscriptsInProgress;

const psttAdapter = require("./psttAdapter");

const isExpired = (sttCheckerExecTime, lastUpdatedTime) => {
  const ONE_DAY_IN_NANOSECONDS = 3600 * 24 * 1000;
  const timeDifference = sttCheckerExecTime - lastUpdatedTime;
  console.debug(`Last updated ${secondsToDhms(timeDifference / 1000)} ago`);
  return timeDifference >= ONE_DAY_IN_NANOSECONDS;
};

// TODO
const updateStatus = (status) => {};

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
  const projectsCollection = await getProjectsCollection(admin);
  const projects = projectsCollection.docs;
  const projectTranscripts = await Promise.all(
    projects.map(
      async (project) => await getTranscriptsInProgress(admin, project.id)
    )
  );
  return projectTranscripts;
};

const updateTranscriptsStatus = async (
  projectTranscripts,
  usersAudioData,
  execTimestamp,
  config
) => {
  filterInvalidJobs(projectTranscripts, execTimestamp).forEach((job) => {
    console.debug(`Job ${job.id} expired, updating status to Error`);
    // TODO: updateStatus("error" , job ... )
  });

  let validJobs = filterValidJobs(projectTranscripts, execTimestamp);

  await validJobs.forEach(async (job) => {
    let status = "";
    let transcript;

    const userId = usersAudioData[job.id]["user"];
    const objectKey = `dpe/users/${userId}/audio/${job.id}.wav`;

    try {
      const response = await getJobStatus(objectKey, config);
      if (response.status < 400) {
        const body = await response.json();
        status = body.status.toLowerCase();
        transcript = body.transcript;
      } else {
        console.error(`[ERROR] Status code ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to get STT jobs status:`, err);
    }

    if (status) {
      // TODO
      // updateStatus(status)
    }

    if (transcript) {
      const { words, paragraphs } = psttAdapter(transcript.items);
    }
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
        await updateTranscriptsStatus(
          transcripts.docs,
          usersAudioData,
          execTimestamp,
          config
        );
      });
  } catch (err) {
    console.error("[ERROR] Could not get valid Jobs", err);
  }

  console.log(`[COMPLETE] Checking STT jobs for in-progress transcriptions`);
};

exports.createHandler = async (admin, config, context) => {
  await sttCheckRunner(admin, config, context.timestamp);
};
