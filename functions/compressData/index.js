const zlib = require("zlib");
const { info, error } = require("firebase-functions")

const {
  getProjectsCollection,
  getTranscriptsCollection,
  getTranscriptsWithStatus,
} = require("../utils/firebase");

const findWordsInParagraph = (paragraph, words) =>
  words.filter(
    (word) => word.start >= paragraph.start && word.end <= paragraph.end
  );

const findWordsOutsideOfParagraphs = (paragraph, words) =>
  words.filter(
    (word) => word.start < paragraph.start || word.end > paragraph.end
  );

const genParagraph = (speaker, wordsInParagraph) => ({
  speaker: speaker,
  text: wordsInParagraph.map((w) => w.text).join(" "),
  words: wordsInParagraph,
});

const groupWordsInParagraphsBySpeakers = (words, paragraphs) => {
  const { newParagraphs } = paragraphs.reduce(
    (results, paragraph) => {
      const wordsInParagraph = findWordsInParagraph(
        paragraph,
        results.newWords
      );

      // optimisation to reduce array size to traverse
      results.newWords = findWordsOutsideOfParagraphs(
        paragraph,
        results.newWords
      );

      if (wordsInParagraph && wordsInParagraph.length > 0) {
        const newParagraph = genParagraph(paragraph.speaker, wordsInParagraph);
        results.newParagraphs.push(newParagraph);
      }

      return results;
    },
    { newParagraphs: [], newWords: words }
  );

  return newParagraphs;
};

const getProjectTranscripts = async (admin) => {
  const projectsCollection = await getProjectsCollection(admin).get();
  const projects = projectsCollection.docs;
  const projectTranscripts = await Promise.all(
    projects.map(
      async (project) =>
        await getTranscriptsWithStatus(admin, project.id, "done").get()
    )
  );
  return projectTranscripts;
};

const updateTranscription = async (admin, transcriptId, projectId, update) => {
  const docRef = getTranscriptsCollection(admin, projectId).doc(transcriptId);
  await docRef.update(update);
};

const decompress = (compressed) => {
  const decompBuff = zlib.gunzipSync(compressed);
  const decompressed = JSON.parse(decompBuff.toString());

  return decompressed;
};

const migrationToCompressionFailed = async (admin, transcriptId, projectId) => {
  // You've messed up...
  const update = {
    status: "error",
    message: "Malformed transcription data, please reupload!",
  };
  await updateTranscription(admin, transcriptId, projectId, update);
};

const validateCompressedGroupC = async (
  groupedc,
  admin,
  transcriptId,
  projectId
) => {
  try {
    decompress(groupedc);
  } catch (e) {
    console.error(e);
    const update = { groupedc: admin.firestore.FieldValue.delete() };
    await updateTranscription(admin, transcriptId, projectId, update);
  }
};

const createGroupedC = (words, paragraphs, wordsc, paragraphsc) => {
  let wordsToCompress;
  let paragraphsToCompress;

  if (words && paragraphs) {
    wordsToCompress = words;
    paragraphsToCompress = paragraphs;
  } else if (wordsc && paragraphsc) {
    wordsToCompress = decompress(wordsc);
    paragraphsToCompress = decompress(paragraphsc);
  }

  const grouped = groupWordsInParagraphsBySpeakers(
    wordsToCompress,
    paragraphsToCompress
  );

  return zlib.gzipSync(JSON.stringify(grouped));
};

const updateTranscriptsWordsParagraphs = async (admin, transcripts) => {
  info(`${transcripts.length} transcripts to process`);
  await transcripts.forEach(async (transcript) => {
    const transcriptId = transcript.id;
    const {
      projectId,
      words,
      paragraphs,
      wordsc,
      paragraphsc,
      groupedc,
    } = transcript.data();

    if (!groupedc && !words && !paragraphs && !paragraphsc && !wordsc) {
      await migrationToCompressionFailed(admin, transcriptId, projectId);
      return;
    }

    if (groupedc) {
      await validateCompressedGroupC(groupedc, admin, transcriptId, projectId);
      return;
    }

    try {
      const update = {
        groupedc: createGroupedC(words, paragraphs, wordsc, paragraphsc),
        word: admin.firestore.FieldValue.delete(),
        paragraph: admin.firestore.FieldValue.delete(),
        wordsc: admin.firestore.FieldValue.delete(),
        paragraphsc: admin.firestore.FieldValue.delete(),
      };

      await updateTranscription(admin, transcriptId, projectId, update);

      info(`Updated ${transcriptId} with data`, update);
    } catch (err) {
      error(
        `[ERROR] Compressing existing transcription data ${transcriptId}: ${err}`
      );
      return;
    }
  });
};

const compressExistingFirestoreContent = async (admin) => {
  info(`[START] Compressing existing transcription data`);

  try {
    const projectTranscripts = await getProjectTranscripts(admin);
    projectTranscripts.forEach(async (transcripts) => {
      const transcriptDocs = transcripts.docs;
      if (transcriptDocs.length > 0) {
        await updateTranscriptsWordsParagraphs(admin, transcriptDocs);
      }
    });
  } catch (err) {
    return error("[ERROR] Could not get transcripts", err);
  }

  return info(`[COMPLETE] Compressing transcriptions`);
};

exports.createHandler = async (admin) => {
  await compressExistingFirestoreContent(admin);
};
