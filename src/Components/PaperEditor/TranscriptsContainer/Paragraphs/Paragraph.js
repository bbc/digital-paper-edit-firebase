import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { shortTimecode } from '@bbc/react-transcript-editor/timecodeConverter';
import Word from './Word';
import AnnotationOverlayTrigger from './AnnotationOverlayTrigger';
import styles from './index.module.css';
import removePunctuation from '../../../../Util/remove-punctuation';

/**
 *  Paragraph display preferences based on search
 *  styles to separate the look of non contiguous paragraphs?
 */
const Paragraph = (props) => {
  const {
    transcriptId,
    isSearchResult,
    handleWordClick,
    labels,
    handleDeleteAnnotation,
    handleEditAnnotation,
    speaker,
    words,
    text
  } = props;

  const [ textWithoutPunctuation, setTextWithoutPunct ] = useState('');

  useEffect(() => {
    setTextWithoutPunct(removePunctuation(text));

    return () => {
      setTextWithoutPunct('');
    };
  }, [ text ]);

  const getWordWithAnnotations = (word) => {
    const wordEl = (
      <Word
        key={ word.id }
        transcriptId={ transcriptId }
        speaker={ speaker }
        word={ word }
        handleKeyPress={ handleWordClick }
      />
    );

    if (word.annotation) {
      return (
        <AnnotationOverlayTrigger
          key={ `${ word.annotation.id }-${ word.text }` }
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

  const getDisplayPref = () => {
    const displayPref = {
      borderStyle: 'dashed',
      borderWidth: '0.01em',
      borderColor: 'lightgray',
      padding: '0.5em',
    };

    if (isSearchResult) {
      displayPref.borderRight = '0.1em dashed lightgrey';
      displayPref.borderLeft = '0.1em dashed lightgrey';
    }

    return displayPref;
  };

  return (
    <Row
      style={ getDisplayPref() }
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
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  handleWordClick: PropTypes.any,
  isSearchResult: PropTypes.any,
  labels: PropTypes.any,
  speaker: PropTypes.string,
  text: PropTypes.any,
  transcriptId: PropTypes.any,
  words: PropTypes.array
};

Paragraph.defaultProps = {
  words: [],
  text: '',
  speaker: ''
};

export default React.memo(Paragraph);
