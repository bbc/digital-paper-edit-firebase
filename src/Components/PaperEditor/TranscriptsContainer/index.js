import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import PropTypes from 'prop-types';

import { withAuthorization } from '../../Session';
import TranscriptNavItem from './TranscriptNavItem';
import TranscriptTabPane from './TranscriptTabPane';

const TranscriptsContainer = ({ transcripts, projectId, firebase }) => {
  const transcriptsElNav = transcripts.map((transcript) => (
    <TranscriptNavItem
      key={ transcript.id }
      title={ transcript.title }
      id={ transcript.id }
      status={ transcript.status }
    />
  ));
  const transcriptsElTab = transcripts.map((transcript) => (
    <TranscriptTabPane
      key={ transcript.id }
      transcriptId={ transcript.id }
      paragraphs={ transcript.paragraphs }
      paragraphsc={ transcript.paragraphsc }
      words={ transcript.words }
      wordsc={ transcript.wordsc }
      media={ transcript.media }
      title={ transcript.title }
      projectId={ projectId }
      firebase={ firebase }
    />
  ));

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
  projectId: PropTypes.any,
  transcripts: PropTypes.any,
  firebase: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(TranscriptsContainer);
