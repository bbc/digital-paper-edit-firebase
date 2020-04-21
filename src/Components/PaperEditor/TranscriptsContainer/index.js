import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import cuid from 'cuid';

import Transcript from './Transcript.js';

const TranscriptsContainer = ({ transcripts, projectId, labelsOptions, annotations }) => {
  const getStatusIcon = (status) => {
    if (status === 'in-progress') {
      return <FontAwesomeIcon icon={ faClock } />;
    } else if (status === 'error') {
      return <FontAwesomeIcon icon={ faExclamationTriangle } />;
    } else {
      return '';
    }
  };

  const getTranscriptNav = (transcript) => {
    return (
      <Nav.Item key={ cuid() }>
        <Nav.Link
          disabled={ transcript.status !== 'done' ? true : false }
          eventKey={ transcript.id }
        >
          {getStatusIcon(transcript.status)}
          {`  ${ transcript.title }`}
        </Nav.Link>
      </Nav.Item>
    );
  };

  const getTranscriptTab = (transcript) => {
    const { id, media, title, url, paragraphs, words } = transcript;
    const mediaType = media.type;

    return (
      <Tab.Pane key={ cuid() } eventKey={ id }>
        <Transcript
          projectId={ projectId }
          transcriptId={ id }
          labelsOptions={ labelsOptions }
          annotations = { annotations }
          title={ title }
          transcript={ { words, paragraphs } }
          mediaType={ mediaType }
          url={ url }
        />
      </Tab.Pane>
    );
  };

  const transcriptsElNav = transcripts.map(transcript => getTranscriptNav(transcript));
  const transcriptsElTab = transcripts.map(transcript => getTranscriptTab(transcript));

  return (
    <>
      <Tab.Container
        defaultActiveKey={
          transcripts[0] ? transcripts[0].id : 'first'
        }
      >
        <Row>
          <Col sm={ 3 }>
            <h2
              className={ [ 'text-truncate', 'text-muted' ].join(' ') }
              title={ 'Transcripts' }
            >
              Transcripts
            </h2>
            <hr />
            <Nav variant="pills" className="flex-column">
              {transcriptsElNav}
            </Nav>
          </Col>
          <Col sm={ 9 }>
            <Tab.Content>
              {transcriptsElTab}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
};

TranscriptsContainer.propTypes = {
  labelsOptions: PropTypes.any,
  projectId: PropTypes.any,
  transcripts: PropTypes.any,
  annotations: PropTypes.any
};

export default TranscriptsContainer;
