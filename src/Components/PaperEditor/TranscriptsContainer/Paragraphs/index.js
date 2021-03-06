import PropTypes from 'prop-types';
import React from 'react';
import Paragraph from './Paragraph';
const Paragraphs = (props) => {
  const {
    paragraphs,
    transcriptId,
    labels,
    handleKeyPress,
    handleKeyDownTimecodes,
    handleDeleteAnnotation,
    handleEditAnnotation,
    isSearchResults,
    displayParagraphs
  } = props;

  const getParagraphEl = (paragraph, searchResultIndex, isSearchResult) => {
    /**
     * Create a Paragraph containing words, with or without annotation (overlay)
     */
    return (
      <Paragraph
        key={ `paragraph-${ transcriptId }-${ searchResultIndex }` }
        transcriptId={ transcriptId }
        labels={ labels }
        isSearchResult={ isSearchResult }
        handleKeyPress={ handleKeyPress }
        handleKeyDownTimecodes={ handleKeyDownTimecodes }
        handleDeleteAnnotation={ handleDeleteAnnotation }
        handleEditAnnotation={ handleEditAnnotation }
        speaker={ paragraph.speaker }
        words={ paragraph.words }
        text={ paragraph.text }
        sourceParagraphIndex = { paragraph.id }
      />
    );
  };

  const paragraphEls = paragraphs
    .filter((paragraph, displayIndex) => displayParagraphs[displayIndex])
    .map((paragraph, searchResultIndex) =>
      getParagraphEl(paragraph, searchResultIndex, isSearchResults[searchResultIndex])
    );

  return <>{paragraphEls}</>;
};

Paragraphs.propTypes = {
  displayParagraphs: PropTypes.any,
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  handleKeyDownTimecodes: PropTypes.any,
  handleKeyPress: PropTypes.any,
  isSearchResults: PropTypes.any,
  labels: PropTypes.any,
  paragraphs: PropTypes.array,
  transcriptId: PropTypes.any
};

export default Paragraphs;
