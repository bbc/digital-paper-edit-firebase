import PropTypes from 'prop-types';
import React from 'react';
// import generateParagraphs from './generate-paragraphs/index.js';
import groupWordsInParagraphsBySpeakers from './group-words-by-speakers.js';
import findAnnotationsInWords from './find-annotation-in-paragraph.js';
import Paragraph from './Paragraph.js';
import computeParagraphDisplayPreference from './compute-paragraph-display-preference.js';
import paragraphWithAnnotations from './add-annotations-to-words-in-paragraphs.js';
import cuid from 'cuid';
import removePunctuation from '../../../../Util/remove-punctuation';

const Transcript = (props) => {

  /* Paragraph text for data attribute for searches, without punctuation */
  const findString = (text) => {
    return text.includes(props.searchString);
  };

  const findSpeaker = (speaker) => {
    if (props.searchSpeakers.length === 0) {
      return true;
    } else {
      const matchingSpeaker = props.searchSpeakers.find((spk) => spk.label === speaker);

      return matchingSpeaker ? true : false;
    }
  };

  const findLabel = (label) => {
    if (props.searchLabels.length === 0) {
      return true;
    } else {
      const matchingLabel = props.searchLabels.find((lb) => lb.id === label);

      return matchingLabel ? true : false;
    }
  };

  /**
   *  Group words into paragraphs
   *
   * TODO: Breaking down words in paragraphs could be done
   * client side or server side?
   * using paragraphs attribute of transcript json
   */

  const getParagraphs = () => {
    const groupedParagraphs = groupWordsInParagraphsBySpeakers(
      props.transcript.words,
      props.transcript.paragraphs
    );

    return paragraphWithAnnotations(groupedParagraphs, props.annotations);
  };

  const getDisplayPreference = (text, speaker, label) => {
    const textWithoutPunctuation = removePunctuation(text);
    const lcSearchString = props.searchString.toLowerCase();

    const foundSearchString = findString(
      lcSearchString,
      textWithoutPunctuation
    );
    const foundSpeaker = findSpeaker(speaker, props.searchSpeakers);
    const foundLabel = findLabel(label, props.searchLabels);

    return computeParagraphDisplayPreference(
      foundSearchString,
      foundSpeaker,
      foundLabel
    );
  };

  const paragraphs = getParagraphs(
    props.transcript.words,
    props.transcript.paragraphs,
    props.annotations
  );

  const getParagraphEl = (paragraph) => {
    const wordsAnnotations = findAnnotationsInWords(
      props.annotations,
      paragraph.words
    );

    const displayPrefs = getDisplayPreference(
      paragraph.text,
      paragraph.speaker,
      wordsAnnotations.labelId
    );

    /**
     * Create a Paragraph containing words, with or without annotation (overlay)
     */
    return (
      <Paragraph
        showParagraphsMatchingSearch={ props.showMatch }
        display={ displayPrefs }
        key={ cuid() }
        paragraph={ paragraph }
        handleWordClick={ (e) =>
          e.key === 'Enter' ? props.handleWordClick(e) : null }
        handleKeyDownTimecodes={ (e) =>
          e.key === 'Enter' ? props.handleTimecodeClick(e) : null }
        annotations={ props.annotations }
        labels={ props.labels }
        transcriptId={ props.transcriptId }
      />
    );
  };

  const paragraphEls = paragraphs.map((paragraph) => getParagraphEl(paragraph));

  return <>{paragraphEls}</>;
};

Transcript.propTypes = {
  annotations: PropTypes.any,
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  handleTimecodeClick: PropTypes.func,
  handleWordClick: PropTypes.func,
  labels: PropTypes.any,
  searchLabels: PropTypes.any,
  searchSpeakers: PropTypes.any,
  searchString: PropTypes.any,
  showMatch: PropTypes.any,
  transcript: PropTypes.shape({
    paragraphs: PropTypes.any,
    words: PropTypes.any
  }),
  transcriptId: PropTypes.any
};

export default Transcript;
