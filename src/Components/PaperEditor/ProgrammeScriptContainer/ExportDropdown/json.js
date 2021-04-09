import timecodes from 'node-timecodes';

import { defaultFps, getCurrentTranscript, defaultReelName, defaultSampleRate, defaultTimecodeOffset } from './helper';

const formatToJSONEvent = (transcript, element) => {

  const result = {
    ...element,
    startTime: element.start,
    endTime: element.end,
    reelName: transcript.metadata
      ? transcript.metadata.reelName
      : defaultReelName,
    clipName: `${ transcript.title }`,
    // TODO: frameRate should be pulled from the clips in the sequence
    // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
    // but again frameRate should not be hard coded
    fps: transcript.metadata
      ? transcript.metadata.fps
      : defaultFps,
    sampleRate: transcript.metadata
      ? transcript.metadata.sampleRate
      : defaultSampleRate,
    offset: transcript.metadata
      ? transcript.metadata.timecode
      : defaultTimecodeOffset
  };

  return result;
};

const getJson = (title, elements, transcripts, isWordDoc) => {
  return elements.reduce((res, element) => {
    if (element.type === 'paper-cut') {
      const transcript = getCurrentTranscript(element, transcripts);
      const jsonEvent = formatToJSONEvent(transcript, element);
      res.index += 1;
      jsonEvent.id = res.index;
      res.events.push(jsonEvent);
    } else if (isWordDoc) {
      res.index += 1;
      element.id = res.index;
      res.events.push(element);
    }

    return res;
  }, {
    title: title,
    events: [],
    index: 0
  });
};

const formatJsonPaperEdit = (ev) => `${ timecodes.fromSeconds(ev.startTime) }\t
${ timecodes.fromSeconds(ev.endTime) }
\t${ ev.speaker }
\t-
\t${ ev.clipName }     \n${ ev.words.map(word => word.text).join(' ') }`;

const formatJsonToText = edlsqJson => {
  const edlTitle = `# ${ edlsqJson.title }\n\n`;
  const body = edlsqJson.events.map(ev => {
    console.log('EDL events', ev);
    if (ev.type === 'title') {
      return `## ${ ev.text }`;
    } else if (ev.type === 'voice-over') {
      return `_${ ev.text }_`;
    } else if (ev.type === 'note') {
      return `[ ${ ev.text }]`;
    } else if (ev.type === 'paper-cut') {
      return formatJsonPaperEdit(ev);
    }

    return null;
  });

  return `${ edlTitle }${ body.join('\n\n') }`;
};

export { getJson, formatJsonToText };