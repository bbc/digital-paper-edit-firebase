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

const Paragraphs = (props) => {
  const {
    searchSpeakers,
    labels,
    transcriptId,
    showMatch,
    handleWordClick,
    handleTimecodeClick,
    searchLabels,
    searchString,
    transcript,
    annotations,
    handleDeleteAnnotation,
    handleEditAnnotation
  } = props;

  /* Paragraph text for data attribute for searches, without punctuation */
  const findString = (text) => {
    return text.includes(searchString);
  };

  const findSpeaker = (speaker) => {
    if (searchSpeakers.length === 0) {
      return true;
    } else {
      const matchingSpeaker = searchSpeakers.find(
        (spk) => spk.label === speaker
      );

      return matchingSpeaker ? true : false;
    }
  };

  const findLabel = (label) => {
    if (searchLabels.length === 0) {
      return true;
    } else {
      const matchingLabel = searchLabels.find((lb) => lb.id === label);

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
      transcript.words,
      transcript.paragraphs
    );

    return paragraphWithAnnotations(groupedParagraphs, annotations);
  };

  const getDisplayPreference = (text, speaker, label) => {
    const textWithoutPunctuation = removePunctuation(text);
    const lcSearchString = searchString.toLowerCase();

    const foundSearchString = findString(
      lcSearchString,
      textWithoutPunctuation
    );
    const foundSpeaker = findSpeaker(speaker, searchSpeakers);
    const foundLabel = findLabel(label, searchLabels);

    return computeParagraphDisplayPreference(
      foundSearchString,
      foundSpeaker,
      foundLabel
    );
  };

  const paragraphs = getParagraphs(
    transcript.words,
    transcript.paragraphs,
    annotations
  );

  const getParagraphEl = (paragraph) => {
    const wordsAnnotations = findAnnotationsInWords(
      annotations,
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
        key={ cuid() }
        transcriptId={ transcriptId }
        paragraph={ paragraph }
        showParagraphsMatchingSearch={ showMatch }
        displayPrefs={ displayPrefs }
        handleWordClick={ (e) => (e.key === 'Enter' ? handleWordClick(e) : null) }
        handleKeyDownTimecodes={ (e) =>
          e.key === 'Enter' ? handleTimecodeClick(e) : null
        }
        labels={ labels }
        handleDeleteAnnotation={ handleDeleteAnnotation }
        handleEditAnnotation={ handleEditAnnotation }
      />
    );
  };

  const paragraphEls = paragraphs.map((paragraph) => getParagraphEl(paragraph));

  return <>{paragraphEls}</>;
};

Paragraphs.propTypes = {
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
    words: PropTypes.any,
  }),
  transcriptId: PropTypes.any,
};

export default Paragraphs;
