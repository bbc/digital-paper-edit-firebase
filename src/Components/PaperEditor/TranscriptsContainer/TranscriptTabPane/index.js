import React from 'react';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import { Suspense } from 'react';
//import TranscriptTabContent from './TranscriptTabContent';

const TranscriptTabContent = React.lazy(() => import('./TranscriptTabContent'));

const TranscriptTabPane = (props) => {
  const { transcriptId, groupedc, media, title, projectId, firebase, trackEvent } = props;

  return (
    <Tab.Pane eventKey={ transcriptId }>
      <Suspense fallback={ <div>Loading Tab </div> }>
        <TranscriptTabContent
          projectId={ projectId }
          transcriptId={ transcriptId }
          title={ title }
          groupedc={ groupedc }
          media={ media }
          firebase={ firebase }
          trackEvent={ trackEvent }
        />
      </Suspense>
    </Tab.Pane>
  );
};

TranscriptTabPane.propTypes = {
  firebase: PropTypes.any,
  groupedc: PropTypes.any,
  media: PropTypes.any,
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcriptId: PropTypes.any,
  trackEvent: PropTypes.func
};

export default TranscriptTabPane;
