import PropTypes from 'prop-types';
import React from 'react';
import removePunctuation from '../../../../Util/remove-punctuation';

const Word = (props) => {
  const { transcriptId, speaker, word, handleKeyPress } = props;

  return (
    <span
      title={ `start:${ word.start } - end:${ word.end }` }
      className={ [
        'words',
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
