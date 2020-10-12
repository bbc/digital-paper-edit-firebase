import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import CustomFooter from '../lib/CustomFooter';
import { withAuthorization } from '../Session';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import UsersView from './UsersView';
import TranscriptsView from './TranscriptsView';

const AdminView = ({ firebase }) => {
  const [ active, setActive ] = useState('transcripts');

  return (
    <>
      <Container>
        <Tabs
          id="controlled-tab-example"
          activeKey={ active }
          onSelect={ tab => setActive(tab) }
        >
          <Tab eventKey="transcripts" title="Transcripts">
            <TranscriptsView firebase={ firebase } />
          </Tab>
          <Tab eventKey="user" title="Users">
            <UsersView firebase={ firebase } />
          </Tab>
        </Tabs>
      </Container>
      <CustomFooter />
    </>
  );
};

AdminView.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  })
};
const condition = (authUser) => (!!authUser);
export default withAuthorization(condition)(AdminView);
