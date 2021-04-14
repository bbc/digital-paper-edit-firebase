import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';
import TranscriptRow from './Row';
import Table from 'react-bootstrap/Table';
import { PROJECTS } from '../../../constants/routes';
import { updateDescOrder } from '../../../Util/time';

const TranscriptsView = props => {
  const [ projects, setProjects ] = useState();
  const [ transcripts, setTranscripts ] = useState();

  useEffect(() => {

    const Projects = new Collection(props.firebase, PROJECTS);
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
  }, [ projects, props.firebase ]);

  useEffect(() => {
    const getDataForRows = async (title, tr, user) => {
      const Uploads = new Collection(props.firebase, `users/${ user }/uploads`);
      const upload = await Uploads.getItem(tr.id);

      return {
        transcriptId: tr.id,
        media:  tr.media,
        message:  tr.message,
        projectId:  tr.projectId,
        runtime:  tr.runtime,
        title:  title,
        transcriptTitle:  tr.title,
        status:  tr.status,
        created:  tr.created,
        updated:  tr.updated,
        duration:  upload ? upload.duration : 0,
        size: upload ? upload.size : 0,
      };
    };

    const getData = async (project) => {
      const { id, title, users } = project;
      const user = users[0];
      const Transcripts = new Collection(
        props.firebase,
        `projects/${ id }/transcripts`
      );
      const trs = await Transcripts.getCollection();

      return await Promise.all(trs.map(async tr => await getDataForRows(title, tr, user)));
    };

    const getTranscripts = async () => {
      try {
        const tr = await Promise.all(projects.map(async p => await getData(p)));
        const flatTrs = tr.flat();
        flatTrs.sort(updateDescOrder);
        setTranscripts(flatTrs);
      } catch (e) {
        console.error('Could not get projects: ', e);
        setTranscripts([]);
      }
    };

    if (projects && !transcripts) {
      getTranscripts();
    }

    return () => {
    };
  }, [ transcripts, projects, props.firebase ]);

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
          {transcripts ? transcripts.map(tr =>
            <TranscriptRow
              key={ tr.transcriptId }
              { ...tr }
            />) : null}
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
