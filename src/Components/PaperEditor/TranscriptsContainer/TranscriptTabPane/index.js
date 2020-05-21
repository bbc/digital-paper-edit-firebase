import React from 'react';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import TranscriptTabContent from '../TranscriptTabContent';
const TranscriptTabPane = (props) => {
  const { transcriptId, paragraphs, words, wordsc, paragraphsc, media, title, projectId, firebase } = props;

  return (
    <Tab.Pane eventKey={ transcriptId }>
      <TranscriptTabContent
        projectId={ projectId }
        transcriptId={ transcriptId }
        title={ title }
        words={ words }
        paragraphs={ paragraphs } // Words and Paragraphs are the fields we want to get from Firestore
        wordsc={ wordsc }
        paragraphsc={ paragraphsc } // Words and Paragraphs are the fields we want to get from Firestore
        media={ media }
        firebase={ firebase }
      />
    </Tab.Pane>
  );
};

TranscriptTabPane.propTypes = {
  firebase: PropTypes.any,
  media: PropTypes.any,
  paragraphs: PropTypes.any,
  paragraphsc: PropTypes.any,
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcriptId: PropTypes.any,
  words: PropTypes.any,
  wordsc: PropTypes.any
};

export default TranscriptTabPane;
