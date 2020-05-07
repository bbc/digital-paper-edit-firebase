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
  const NUMBER_OF_HOURS = 6
  const ONE_DAY_IN_NANOSECONDS = 3600 * NUMBER_OF_HOURS * 1000;
  const timeDifference = sttCheckerExecTime - lastUpdatedTime;
  return {
    expired: timeDifference >= ONE_DAY_IN_NANOSECONDS,
    expiredByNano: timeDifference,
  };
};

const isValidJob = (execTimestamp, transcript) => {
  const transcriptData = transcript.data();
  const sttCheckerExecTime = Date.parse(execTimestamp);
  const lastUpdatedTime = transcriptData.updated.toDate().getTime();

  const { expired, expiredByNano } = isExpired(
    sttCheckerExecTime,
    lastUpdatedTime
  );

  // make sure objectKey exists in upload

  if (expired) {
    console.debug(
      `Last updated ${transcript.id} ${secondsToDhms(expiredByNano / 1000)} ago`
    );
    return false;
  }
  return true;
};

const filterValidJobs = (transcripts, execTimestamp) =>
  transcripts.filter((transcript) => isValidJob(execTimestamp, transcript));

const filterInvalidJobs = (transcripts, execTimestamp) =>
  transcripts.filter((transcript) => !isValidJob(execTimestamp, transcript));

const successfulHTTPStatus = (status) => status < 400;

const getJobStatus = async (fileName, config) => {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": config.key,
  };
  const body = {
    serviceName: "dpe",
    fileName: fileName,
  };
  const request = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  };
  const response = await fetch(config.endpoint, request);

  if (successfulHTTPStatus(response.status)) {
    const responseData = await response.json();
    return {
      status: responseData.status.toLowerCase(),
      transcript: responseData.transcript,
    };
  } else {
    throw new Error(`Status code ${response.status}: ${response.statusText}`);
  }
};

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
  await filterInvalidJobs(projectTranscripts, execTimestamp).forEach(
    async (job) => {
      console.debug(`Job ${job.id} expired, updating status to Error`);
      const { projectId } = job.data();
      await updateTranscription(admin, job.id, projectId, { status: "error" });
    }
  );

  let validJobs = filterValidJobs(projectTranscripts, execTimestamp);

  console.debug(`${validJobs.length} valid jobs to process`);

  await validJobs.forEach(async (job) => {
    let response;
    const usersAudioDataJob = usersAudioData[job.id];
    if (!usersAudioDataJob) {
      console.log(`[ERROR] Job ID {job.id} not found`);
      return;
    }
    const userId = usersAudioDataJob.user;
    const fileName = `users/${userId}/audio/${job.id}.wav`;

    try {
      response = await getJobStatus(fileName, config);
      console.debug(`Response from STT for ${fileName}:`, response);
    } catch (err) {
      console.error(
        `[ERROR] Failed to get STT jobs status for ${fileName}: ${err}`
      );
      return;
    }

    if (response.status === "in-progress") {
      return;
    }

    let update = { payload: response.transcript, status: response.status };

    if (update.status === "success") {
      const { words, paragraphs } = psttAdapter(update.payload.items);
      update.words = words;
      update.paragraphs = paragraphs;
      update.status = "done";
    }

    const { projectId } = job.data();
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
    projectTranscripts.forEach(async (transcripts) => {
      const transcriptDocs = transcripts.docs;
      if (transcriptDocs.length > 0) {
        await updateTranscriptsStatus(
          admin,
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
};

exports.createHandler = async (admin, config, context) => {
  await sttCheckRunner(admin, config, context.timestamp);
  console.log(
    `[COMPLETE] Checking STT jobs for in-progress transcriptions`
  );
};
