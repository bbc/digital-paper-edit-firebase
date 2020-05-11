import PropTypes from 'prop-types';
import React from 'react';
import removePunctuation from '../../../../Util/remove-punctuation';

const Word = (props) => {
  const generatePreviousTimes = (start) => {
    let prevTimes = '';

    for (let i = 0; i < start; i++) {
      prevTimes += `${ i } `;
    }

    if (start % 1 > 0) {
      // Find the closest quarter-second to the current time, for more dynamic results
      const dec = Math.floor((start % 1) * 4.0) / 4.0;
      prevTimes += ` ${ Math.floor(start) + dec }`;
    }

    return prevTimes;
  };
  const { transcriptId, speaker, word, handleKeyPress } = props;

  return (
    <span
      title={ `start:${ word.start } - end:${ word.end }` }
      data-prev-times={ generatePreviousTimes(word.start) }
      className={ [
        'words',
        // , styles.highlightedWord
      ].join(' ') }
      data-start={ word.start }
      data-text={ removePunctuation(word.text) }
      data-end={ word.end }
      data-transcript-id={ transcriptId }
      data-speaker={ speaker }
      key={ 'key_' + word.id + '_' + word.end }
      role="button"
      aria-pressed="false"
      onKeyDown={ handleKeyPress }
    >
      {word.text}{' '}
    </span>
  );
};

Word.propTypes = {
  handleKeyPress: PropTypes.any,
  speaker: PropTypes.any,
  transcriptId: PropTypes.any,
  word: PropTypes.shape({
    end: PropTypes.any,
    id: PropTypes.any,
    start: PropTypes.any,
    text: PropTypes.any,
  }),
};

export default React.memo(Word);
