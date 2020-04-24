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

  //   Transcript.propTypes = {
  //   annotations: PropTypes.any,
  //   handleDeleteAnnotation: PropTypes.any,
  //   handleEditAnnotation: PropTypes.any,
  //   handleTimecodeClick: PropTypes.func,
  //   handleWordClick: PropTypes.func,
  //   labels: PropTypes.any,
  //   searchLabels: PropTypes.any,
  //   searchSpeakers: PropTypes.any,
  //   searchString: PropTypes.any,
  //   showMatch: PropTypes.any,
  //   transcript: PropTypes.shape({
  //     paragraphs: PropTypes.any,
  //     words: PropTypes.any
  //   }),
  //   transcriptId: PropTypes.any
  // };
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
    words: PropTypes.any,
  }),
  transcriptId: PropTypes.any,
};

export default Transcript;

// import PropTypes from 'prop-types';
// import React from 'react';
// // import generateParagraphs from './generate-paragraphs/index.js';
// import groupWordsInParagraphsBySpeakers from './group-words-by-speakers.js';
// import findAnnotationsInWords from './find-annotation-in-paragraph.js';
// import Paragraph from './Paragraph.js';
// import Word from './Word.js';
// import AnnotationOverlayTrigger from './AnnotationOverlayTrigger.js';
// import computeParagraphDisplayPreference from './compute-paragraph-display-preference.js';
// import paragraphWithAnnotations from './add-annotations-to-words-in-paragraphs.js';
// // import removePunctuation from '../../../../../Util/remove-punctuation.js';
// const removePunctuation = (string) => {
//   return string.replace(/\.|\?|!|,|;/, '').toLowerCase();
// };

// const Paragraphs = (props) => {
//   let paragraphDisplayPreference = {};

//   /**
//    *  Group words into paragraphs
//    *
//    * TODO: Breaking down words in paragraphs could be done
//    * client side or server side?
//    * using paragraphs attribute of transcript json
//    */

//   const paragraphsWithWordsSpeakerText = groupWordsInParagraphsBySpeakers(
//     props.transcript.words,
//     props.transcript.paragraphs
//   );

//   const paragraphsWithWordsSpeakersAnnotations = paragraphWithAnnotations(
//     paragraphsWithWordsSpeakerText,
//     props.annotations
//   );
//   /**
//    * Loop over paragraphs
//    */
//   const textResult = paragraphsWithWordsSpeakersAnnotations.map(
//     (paragraph, index) => {
//       let annotationInCurrentParagraph;
//       if (props.annotations && paragraph.words) {
//         annotationInCurrentParagraph = findAnnotationsInWords(
//           props.annotations,
//           paragraph.words
//         );
//       }
//       /* Paragraph text for data attribute for searches, without punctuation */
//       const paragraphTextWithoutPunctuation = removePunctuation(paragraph.text);
//       const isTextSearch = paragraphTextWithoutPunctuation.includes(
//         props.searchString.toLowerCase()
//       );
//       let isSpeakerSearch = false;
//       if (props.selectedOptionSpeakerSearch.length !== 0) {
//         // checks speaker against list of speakers in search,
//         // TODO: Downcase comparison or use speaker ID?
//         if (
//           props.selectedOptionSpeakerSearch.find((spk) => {
//             return spk.label === paragraph.speaker;
//           })
//         ) {
//           isSpeakerSearch = true;
//         }
//       } else {
//         isSpeakerSearch = true;
//       }

//       let isLabelSearch = false;
//       if (props.selectedOptionLabelSearch.length !== 0) {
//         // checks label against list of speakers in search,
//         if (
//           props.selectedOptionLabelSearch.find((lb) => {
//             return lb.id === annotationInCurrentParagraph.labelId;
//           })
//         ) {
//           isLabelSearch = true;
//         }
//       } else {
//         isLabelSearch = true;
//       }
//       paragraphDisplayPreference = computeParagraphDisplayPreference(
//         isTextSearch,
//         isSpeakerSearch,
//         isLabelSearch
//       );

//       /**
//        * find Annotation In Paragraph/words
//        */
//       let wordsElements;
//       if (paragraph && paragraph.words) {
//         wordsElements = paragraph.words.map((word, index) => {
//           let result;
//           const wordEl = (
//             <Word
//               transcriptId={ props.transcriptId }
//               speaker={ paragraph.speaker }
//               key={ 'key--' + index }
//               word={ word }
//               handleKeyDownWords={ (e) => {
//                 return e.key === 'Enter' ? props.handleWordClick(e) : null;
//               } }
//             />
//           );

//           if (word.annotation) {
//             // const { annotation } = word;
//             result = (
//               <AnnotationOverlayTrigger
//                 key={ 'key----' + index }
//                 words={ wordEl }
//                 labels={ props.labels }
//                 annotationLabelId={ word.annotation.labelId }
//                 annotationId={ word.annotation.id }
//                 annotationNote={ word.annotation.note }
//                 handleDeleteAnnotation={ props.handleDeleteAnnotation }
//                 handleEditAnnotation={ props.handleEditAnnotation }
//               />
//             );
//           } else {
//             result = wordEl;
//           }

//           return result;
//         });
//       };

//       /**
//        * Create a Paragraph containing words, with or without annotation (overlay)
//        */
//       return (
//         <Paragraph
//           showParagraphsMatchingSearch={ props.showParagraphsMatchingSearch }
//           paragraphDisplayPreference={ paragraphDisplayPreference }
//           key={ 'key------' + index }
//           paragraphTextWithoutPunctuation={ paragraphTextWithoutPunctuation }
//           speakerName={ paragraph.speaker }
//           paragraph={ paragraph.words }
//           handleKeyDownTimecodes={ (e) => {
//             return e.key === 'Enter' ? props.handleTimecodeClick(e) : null;
//           } }
//           wordsElements={ wordsElements }
//         />
//       );
//     }
//   );

//   return <>{textResult}</>;
// };

// Paragraphs.propTypes = {
//   annotations: PropTypes.any,
//   handleDeleteAnnotation: PropTypes.any,
//   handleEditAnnotation: PropTypes.any,
//   handleTimecodeClick: PropTypes.func,
//   handleWordClick: PropTypes.func,
//   labels: PropTypes.any,
//   searchString: PropTypes.string,
//   selectedOptionLabelSearch: PropTypes.array,
//   selectedOptionSpeakerSearch: PropTypes.array,
//   showParagraphsMatchingSearch: PropTypes.any,
//   transcriptId: PropTypes.any,
//   transcript: PropTypes.shape({
//     paragraphs: PropTypes.any,
//     words: PropTypes.any,
//   }),
// };

// export default Paragraphs;
