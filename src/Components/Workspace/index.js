import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CustomFooter from '../lib/CustomFooter';
import Transcripts from './Transcripts';
import PaperEdits from './PaperEdits';
import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';
import { withAuthorization } from '../Session';

const genBreadcrumb = name => [
  {
    name: 'Projects',
    link: '/projects'
  },
  {
    name: name
  }
];

const WorkspaceView = props => {
  const collections = props.collections;
  const id = props.match.params.projectId;

  const [ active, setActive ] = useState('transcripts');
  const [ title, setTitle ] = useState('Project Title');

  useEffect(() => {
    if (collections) {
      const project = collections.getProject(id);
      setTitle(project.title);
    }

    return () => {};
  }, [ collections, id ]);

  return (
    <>
      <Container style={ { marginBottom: '5em', marginTop: '1em' } }>
        <Row>
          <Col sm={ 12 }>
            <Breadcrumb items={ genBreadcrumb(title) } />
          </Col>
        </Row>

        <Tabs
          id="controlled-tab-example"
          activeKey={ active }
          onSelect={ tab => setActive(tab) }
        >
          <Tab eventKey="transcripts" title="Transcripts">
            <Container style={ { marginBottom: '5em', marginTop: '1em' } }>
              <Transcripts projectId={ id } />
            </Container>
          </Tab>

          <Tab eventKey="paperedits" title="Paper Edits">
            <Container style={ { marginBottom: '5em', marginTop: '1em' } }>
              <PaperEdits projectId={ id } />
            </Container>
          </Tab>
        </Tabs>
      </Container>
      <CustomFooter />
    </>
  );
};

WorkspaceView.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  })
};
const condition = authUser => !!authUser;
export default withAuthorization(condition)(WorkspaceView);
