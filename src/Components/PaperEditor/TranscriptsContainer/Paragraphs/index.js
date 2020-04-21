import PropTypes from 'prop-types';
import React from 'react';
// import generateParagraphs from './generate-paragraphs/index.js';
import groupWordsInParagraphsBySpeakers from './group-words-by-speakers.js';
import findAnnotationsInWords from './find-annotation-in-paragraph.js';
import Paragraph from './Paragraph.js';
import Word from './Word.js';
import AnnotationOverlayTrigger from './AnnotationOverlayTrigger.js';
import computeParagraphDisplayPreference from './compute-paragraph-display-preference.js';
import paragraphWithAnnotations from './add-annotations-to-words-in-paragraphs.js';
// import removePunctuation from '../../../../../Util/remove-punctuation.js';
const removePunctuation = (string) => {
  return string.replace(/\.|\?|!|,|;/, '').toLowerCase() ;
};

const Paragraphs = (props) => {
  let paragraphDisplayPreference = {};

  /**
     *  Group words into paragraphs
     *
     * TODO: Breaking down words in paragraphs could be done
     * client side or server side?
     * using paragraphs attribute of transcript json
     */

  const paragraphsWithWordsSpeakerText = groupWordsInParagraphsBySpeakers(
    props.transcript.words,
    props.transcript.paragraphs
  );

  const paragraphsWithWordsSpeakersAnnotations = paragraphWithAnnotations(paragraphsWithWordsSpeakerText, props.annotations);
  /**
     * Loop over paragraphs
     */
  const textResult = paragraphsWithWordsSpeakersAnnotations.map((paragraph, index) => {

    const annotationInCurrentParagraph = findAnnotationsInWords(props.annotations, paragraph.words);
    /* Paragraph text for data attribute for searches, without punctuation */
    const paragraphTextWithoutPunctuation = removePunctuation(paragraph.text);
    const isTextSearch = paragraphTextWithoutPunctuation.includes(props.searchString.toLowerCase());
    let isSpeakerSearch = false;
    if (props.selectedOptionSpeakerSearch.length !== 0) {
      // checks speaker against list of speakers in search,
      // TODO: Downcase comparison or use speaker ID?
      if (props.selectedOptionSpeakerSearch.find((spk) => {return spk.label === paragraph.speaker; })) {
        isSpeakerSearch = true;
      }
    }
    else {
      isSpeakerSearch = true;
    }

    let isLabelSearch = false;
    if (props.selectedOptionLabelSearch.length !== 0) {
      // checks label against list of speakers in search,
      if (props.selectedOptionLabelSearch.find((lb) => {return lb.id === annotationInCurrentParagraph.labelId; })) {
        isLabelSearch = true;
      }
    }
    else {
      isLabelSearch = true;
    }
    paragraphDisplayPreference = computeParagraphDisplayPreference(isTextSearch, isSpeakerSearch, isLabelSearch);

    /**
       * find Annotation In Paragraph/words
       */
    const wordsElements = paragraph.words.map((word, index) => {
      let result;
      const wordEl = (<Word
        transcriptId={ props.transcriptId }
        speaker={ paragraph.speaker }
        key={ 'key--' + index }
        word={ word }
        handleKeyDownWords={ e => {
          return e.key === 'Enter' ? props.handleWordClick(e) : null;
        } }
      />);

      if (word.annotation) {
        // const { annotation } = word;
        result = <AnnotationOverlayTrigger
          key={ 'key----' + index }
          words={ wordEl }
          labelsOptions={ props.labelsOptions }
          annotationLabelId={ word.annotation.labelId }
          annotationId={ word.annotation.id }
          annotationNote={ word.annotation.note }
          handleDeleteAnnotation={ props.handleDeleteAnnotation }
          handleEditAnnotation={ props.handleEditAnnotation }
        />;
      }
      else {
        result = wordEl;
      }

      return result;
    });

    /**
       * Create a Paragraph containing words, with or without annotation (overlay)
       */
    return (
      <Paragraph
        showParagraphsMatchingSearch={ props.showParagraphsMatchingSearch }
        paragraphDisplayPreference={ paragraphDisplayPreference }
        key={ 'key------' + index }
        paragraphTextWithoutPunctuation={ paragraphTextWithoutPunctuation }
        speakerName={ paragraph.speaker }
        paragraph={ paragraph.words }
        handleKeyDownTimecodes={ e => {
          return e.key === 'Enter' ? props.handleTimecodeClick(e) : null;
        } }
        wordsElements={ wordsElements }
      />
    );
  });

  return (
    <>
      {textResult}
    </>
  );
};

Paragraphs.propTypes = {
  annotations: PropTypes.any,
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  handleTimecodeClick: PropTypes.func,
  handleWordClick: PropTypes.func,
  labelsOptions: PropTypes.any,
  searchString: PropTypes.shape({
    toLowerCase: PropTypes.func
  }),
  selectedOptionLabelSearch: PropTypes.shape({
    find: PropTypes.func,
    length: PropTypes.number
  }),
  selectedOptionSpeakerSearch: PropTypes.shape({
    find: PropTypes.func,
    length: PropTypes.number
  }),
  showParagraphsMatchingSearch: PropTypes.any,
  transcriptId: PropTypes.any,
  transcript: PropTypes.shape({
    paragraphs: PropTypes.any,
    words: PropTypes.any
  })
};

export default Paragraphs;
