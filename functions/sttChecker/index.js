const fetch = require('node-fetch');
const { info, error } = require('firebase-functions/lib/logger');
const { secondsToDhms } = require('../utils');
const zlib = require('zlib');

const {
  getUsersAudioData,
  getProjectsCollection,
  getTranscriptsCollection,
  getTranscriptsInProgress,
} = require('../utils/firebase');

const psttAdapter = require('./psttAdapter');

const isExpired = (execTimestamp, updated) => {
  const sttCheckerExecTime = Date.parse(execTimestamp);
  const lastUpdatedTime = updated.toDate().getTime();
  const NUMBER_OF_HOURS = 6;
  const ONE_DAY_IN_NANOSECONDS = 3600 * NUMBER_OF_HOURS * 1000;
  const timeDifference = sttCheckerExecTime - lastUpdatedTime;

  return {
    expired: timeDifference >= ONE_DAY_IN_NANOSECONDS,
    expiredByNano: timeDifference,
  };
};

const getRuntime = (execTimestamp, created) => {
  const createdTime = created.toDate().getTime();
  const sttCheckerExecTime = Date.parse(execTimestamp);
  const timeDifference = sttCheckerExecTime - createdTime;

  return {
    humanReadable: secondsToDhms(timeDifference / 1000),
    runtimeByNano: timeDifference,
  };
};

const isValidJob = (execTimestamp, transcript) => {
  const { updated } = transcript.data();

  const { expired, expiredByNano } = isExpired(
    execTimestamp,
    updated
  );

  // TODO make sure objectKey exists in upload

  if (expired) {
    info(
      `Last updated ${ transcript.id } ${ secondsToDhms(expiredByNano / 1000) } ago`
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
    'Content-Type': 'application/json',
    'X-API-Key': config.key,
  };
  const body = {
    serviceName: 'dpe',
    fileName: fileName,
  };
  const request = {
    method: 'POST',
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
    throw new Error(`Status code ${ response.status }: ${ response.statusText }`);
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

const getUserfromJob = (usersAudioData, jobId) => {
  const usersAudioDataJob = usersAudioData[jobId];
  if (!usersAudioDataJob) {
    error(`[ERROR] Job ID ${ jobId } not found`);

    return '';
  }

  return usersAudioDataJob.user;
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
      info(`Job ${ job.id } expired, updating status to Error`);
      const { projectId } = job.data();
      await updateTranscription(admin, job.id, projectId, {
        status: 'error',
        message: 'Job expired',
      });
    }
  );

  const validJobs = filterValidJobs(projectTranscripts, execTimestamp);

  info(`${ validJobs.length } valid jobs to process`);

  await validJobs.forEach(async (job) => {
    const jobId = job.id;
    const userId = getUserfromJob(usersAudioData, jobId);
    const { projectId, message, created } = job.data();
    const fileName = `users/${ userId }/audio/${ jobId }.wav`;
    const jobData = {
      id: jobId,
      userId,
      projectId
    };

    try {
      const update = { message: 'Transcribing...' };
      const response = await getJobStatus(fileName, config);

      if (response.status) {
        if (response.status === 'in-progress' && message === update.message) {
          return;
        }

        update.status = response.status;

        if (response.status === 'success') {
          const { grouped } = psttAdapter(response.transcript.items);
          update.groupedc = zlib.gzipSync(JSON.stringify(grouped));
          update.status = 'done';
          update.runtime = getRuntime(execTimestamp, created);
          info(
            `Finished job ${ jobId } in ${ update.runtime.humanReadable }: `, jobData
          );
        }
      }
      await updateTranscription(admin, job.id, projectId, update);
      info(`Updated ${ job.id } with data ${ JSON.stringify(update) }`, jobData);
    } catch (err) {
      error(
        `[ERROR] Failed to get STT jobs status for ${ fileName }: `, { ...jobData, err }
      );

      return;
    }
  });
};

const sttCheckRunner = async (admin, config, execTimestamp) => {
  info('[START] Checking STT jobs for in-progress transcriptions');
  let usersAudioData = {};

  try {
    usersAudioData = await getUsersAudioData(admin);
  } catch (err) {
    return error("[ERROR] Could not get user's audio data", err);
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
    return error('[ERROR] Could not get valid jobs', err);
  }

  return info(
    '[COMPLETE] Checking STT jobs for in-progress transcriptions'
  );
};

exports.createHandler = async (admin, config, context) => {
  await sttCheckRunner(admin, config, context.timestamp);
};

exports.updateTranscription = updateTranscription;