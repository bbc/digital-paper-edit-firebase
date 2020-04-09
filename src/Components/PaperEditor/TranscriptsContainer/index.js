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

const Transcripts = ({ transcripts, projectId, labelsOptions }) => {
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
          {`  ${ transcript.transcriptTitle }`}
        </Nav.Link>
      </Nav.Item>
    );
  };

  const getTranscriptTab = ({ id, transcript, mediaType, transcriptTitle, url }) => {
    return (
      <Tab.Pane key={ cuid() } eventKey={ id }>
        <Transcript
          projectId={ projectId }
          transcriptId={ id }
          labelsOptions={ labelsOptions }
          title={ transcriptTitle }
          transcript={ transcript }
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

Transcripts.propTypes = {
  labelsOptions: PropTypes.any,
  projectId: PropTypes.any,
  transcripts: PropTypes.any
};

export default Transcripts;
