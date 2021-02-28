const defaultReelName = 'NA';
const defaultFps = 25;
const defaultTimecodeOffset = '00:00:00:00';
const defaultSampleRate = '16000';

// /**
//  * Helper function to create json EDL for other EDL/ADL/FPCX export
//  */

const getCurrentTranscript = (element, transcripts) => transcripts.find(tr => {
  return tr.id === element.transcriptId;
});

export { defaultFps, getCurrentTranscript, defaultReelName, defaultSampleRate, defaultTimecodeOffset };