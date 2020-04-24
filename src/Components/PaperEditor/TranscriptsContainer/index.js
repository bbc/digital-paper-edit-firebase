import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import cuid from 'cuid';

import TranscriptTabContent from './TranscriptTabContent';

const TranscriptsContainer = ({ transcripts, projectId, firebase }) => {
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

  const getTranscriptTabContents = (transcript) => {
    const { id, paragraphs, words, media, title } = transcript;

    return (
      <Tab.Pane key={ cuid() } eventKey={ id }>
        <TranscriptTabContent
          projectId={ projectId }
          transcriptId={ id }
          title={ title }
          transcript={ { words: words, paragraphs: paragraphs } } // Words and Paragraphs are the fields we want to get from Firestore
          media={ media }
          firebase={ firebase }
        />
      </Tab.Pane>
    );
  };

  const transcriptsElNav = transcripts.map((transcript) =>
    getTranscriptNav(transcript)
  );
  const transcriptsElTab = transcripts.map((transcript) =>
    getTranscriptTabContents(transcript)
  );

  return (
    <>
      <Tab.Container
        defaultActiveKey={ transcripts[0] ? transcripts[0].id : 'first' }
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
            <Tab.Content>{transcriptsElTab}</Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
};

TranscriptsContainer.propTypes = {
  projectId: PropTypes.any,
  transcripts: PropTypes.any,
  firebase: PropTypes.any,
};

export default TranscriptsContainer;
