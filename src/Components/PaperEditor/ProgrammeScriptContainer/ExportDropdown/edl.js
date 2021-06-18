import writeEDL from '@bbc/aes31-adl-composer';
import { defaultReelName, getCurrentTranscript, defaultTimecodeOffset, defaultSampleRate, defaultFps } from './helper';

const formatToEDLEvent = (transcript, element, index) => {
  const result = {
    id: index,
    startTime: element.start,
    endTime: element.end,
    reelName: transcript.metadata
      ? transcript.metadata.reelName
      : defaultReelName,
    clipName: `${ encodeURIComponent(transcript.title) }`,
    // TODO: frameRate should be pulled from the clips in the sequence
    // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
    // but again frameRate should not be hard coded
    fps: transcript.metadata
      ? transcript.metadata.fps
      : defaultFps,
    // TODO: if there is an offset this should added here, for now hard coding 0
    offset: transcript.metadata
      ? transcript.metadata.timecode
      : defaultTimecodeOffset,
    sampleRate: transcript.metadata
      ? transcript.metadata.sampleRate
      : defaultSampleRate
  };

  return result;
};

const mergeConsecutiveElements = (elements) => {
  const paperCuts = elements.filter(element => element.type === 'paper-cut');

  return paperCuts.reduce((accumulator, currentElement) => {
    if (accumulator.length > 0) {
      const prevElement = accumulator[accumulator.length - 1];
      const areElementsConsecutive =
        currentElement.transcriptId === prevElement.transcriptId &&
        prevElement.end === currentElement.start;

      if (areElementsConsecutive) {
        const mergedElement = { ...prevElement, end: currentElement.end };

        return [ ...accumulator.slice(0, accumulator.length - 1), mergedElement ];
      } else {
        return [ ...accumulator, currentElement ];
      }
    }

    return [ ...accumulator, currentElement ];
  }, []);
};

const getEDLSq = (title, elements, transcripts) => {
  const mergedElements = mergeConsecutiveElements(elements);

  return mergedElements.reduce((res, element) => {
    const transcript = getCurrentTranscript(element, transcripts);
    const edlEvent = formatToEDLEvent(transcript, element, res.index + 1);

    return { ...res, events: [ ...res.events, edlEvent ] };
  }, {
    title: title,
    events: [],
    index: 0
  });
};

const formatToADLEvent = (transcript, element) => {
  const fileNameNoExtension = transcript.fileName.replace(/\.[^/.]+$/, '');
  const result = {
    start: element.start,
    end: element.end,
    reelName: transcript.title
      ? transcript.title
      : defaultReelName,
    clipName: transcript.fileName,
    // TODO: frameRate should be pulled from the clips in the sequence
    // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
    // but again frameRate should not be hard coded
    fps: transcript.metadata
      ? transcript.metadata.fps
      : defaultFps,
    // TODO: if there is an offset this should added here, for now hard coding 0
    offset: transcript.metadata
      ? transcript.metadata.timecode
      : defaultTimecodeOffset,
    sampleRate: transcript.metadata
      ? transcript.metadata.sampleRate
      : defaultSampleRate,
    label: fileNameNoExtension,
    uuid: transcript.uuid,
    path: transcript.path
  };

  return result;
};

const getADLSq = (projectTitle, title, elements, transcripts) => {
  const mergedElements = mergeConsecutiveElements(elements);

  const edits = mergedElements
    .filter((el) => el.type === 'paper-cut')
    .map((element, index) => {
      const transcript = getCurrentTranscript(element, transcripts);
      const edit = formatToADLEvent(transcript, element);
      edit.id = index + 1;

      return edit;
    });

  const result = writeEDL({
    projectOriginator: 'Digital Paper Edit',
    // TODO: it be good to change sequence for the ADL to be same schema
    // as the one for EDL and FCPX - for now just adjusting
    edits: edits,
    sampleRate: 48000, // should be 48000 default
    frameRate: 25,
    projectName: `${ projectTitle }-${ title }`,
  });

  return result;
};

// https://www.npmjs.com/package/downloadjs
// https://www.npmjs.com/package/edl_composer

export { getEDLSq, getADLSq };
