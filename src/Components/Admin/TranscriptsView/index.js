import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import CustomFooter from '../../lib/CustomFooter';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';
import TranscriptRow from './Row';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { PROJECTS } from '../../../constants/routes';

const TranscriptsView = props => {
  const Projects = new Collection(props.firebase, PROJECTS);
  const [ projects, setProjects ] = useState();

  useEffect(() => {
    const getProjects = async () => {
      try {
        const allProjects = await Projects.getCollection();
        setProjects(allProjects);
      } catch (e) {
        console.error('Could not get projects: ', e);
        setProjects([]);
      }
    };

    if (!projects) {
      getProjects();
    }

    return () => {
    };
  }, [ Projects, projects ]);

  return (
    <>
      <Table responsive>
        <thead>
          <tr>
            <th>Status</th>
            <th>Message</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Transcript ID</th>
            <th>Transcript Title</th>
            <th>Project ID</th>
            <th>Project Title</th>
            <th>Transcription Duration (Dhms)</th>
            <th>Duration (Hms)</th>
            <th>Size (bytes)</th>
            <th>File location</th>
            <th>Media Type</th>
          </tr>
        </thead>
        <tbody>
          {projects ? projects.map(p =>
            <TranscriptRow project={ p } firebase={ props.firebase } key={ p.id }/>
          ) : null}
        </tbody>

      </Table>
    </>
  );
};

TranscriptsView.propTypes = {
  firebase: PropTypes.any,
};
const condition = (authUser) => (!!authUser);
export default withAuthorization(condition)(TranscriptsView);
