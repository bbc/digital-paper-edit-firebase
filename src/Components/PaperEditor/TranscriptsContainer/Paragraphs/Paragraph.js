import PropTypes from 'prop-types';
import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { shortTimecode } from '@bbc/react-transcript-editor/timecodeConverter';
import Word from './Word';
import AnnotationOverlayTrigger from './AnnotationOverlayTrigger';
import styles from './index.module.css';
import cuid from 'cuid';
import removePunctuation from '../../../../Util/remove-punctuation';

/**
 *  Paragraph display preferences based on search
 *  styles to separate the look of non contiguous paragraphs?
 */
const Paragraph = (props) => {
  const {
    transcriptId,
    paragraph,
    displayPrefs,
    showParagraphsMatchingSearch,
    handleWordClick,
    labels,
    handleDeleteAnnotation,
    handleEditAnnotation,
  } = props;

  const { speaker, words, text } = paragraph;
  const textWithoutPunctuation = removePunctuation(text);

  const paragraphStyle = {
    ...displayPrefs,
    borderStyle: 'dashed',
    borderWidth: '0.01em',
    borderColor: 'lightgray',
    padding: '0.5em',
  };

  if (!showParagraphsMatchingSearch && !paragraphStyle.display) {
    delete paragraphStyle.display;
    paragraphStyle.borderRight = '0.1em dashed lightgrey';
    paragraphStyle.borderLeft = '0.1em dashed lightgrey';
  }

  const getWordWithAnnotations = (word) => {
    const wordEl = (
      <Word
        transcriptId={ transcriptId }
        speaker={ speaker }
        key={ cuid() }
        word={ word }
        handleKeyPress={ handleWordClick }
      />
    );

    if (word.annotation) {
      return (
        <AnnotationOverlayTrigger
          key={ cuid() }
          words={ wordEl }
          labels={ labels }
          annotation={ word.annotation }
          handleDeleteAnnotation={ handleDeleteAnnotation }
          handleEditAnnotation={ handleEditAnnotation }
        />
      );
    }

    return wordEl;
  };

  /**
   * find Annotation In Paragraph/words
   */

  const wordsElements = words.map((word) => getWordWithAnnotations(word));

  return (
    <Row
      style={ paragraphStyle }
      className="paragraph"
      data-paragraph-text={ textWithoutPunctuation }
    >
      <Col
        xs={ 12 }
        sm={ 12 }
        md={ 3 }
        lg={ 3 }
        xl={ 2 }
        style={ { cursor: 'pointer', width: '100%' } }
        className={ 'text-truncate' }
        title={ `${ speaker.toUpperCase() } -  ${ shortTimecode(words[0].start) }` }
      >
        <span
          className={ [ styles.speaker, styles.unselectable, 'timecode' ].join(
            ' '
          ) }
          data-start={ words[0].start }
          tabIndex="0"
        >
          {speaker}
        </span>
      </Col>

      <Col xs={ 12 } sm={ 12 } md={ 9 } lg={ 9 } xl={ 10 }>
        {wordsElements}
      </Col>
    </Row>
  );
};

Paragraph.propTypes = {
  displayPrefs: PropTypes.shape({
    borderColor: PropTypes.any,
    borderStyle: PropTypes.any,
    borderWidth: PropTypes.any,
    display: PropTypes.any,
    padding: PropTypes.any,
  }),
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  handleWordClick: PropTypes.any,
  labels: PropTypes.any,
  paragraph: PropTypes.any,
  showParagraphsMatchingSearch: PropTypes.any,
  transcriptId: PropTypes.any,
};

export default Paragraph;
