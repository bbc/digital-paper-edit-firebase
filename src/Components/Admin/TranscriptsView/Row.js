import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Badge from 'react-bootstrap/Badge';
import Collection from '../../Firebase/Collection';
import { ToDhmsCompact } from '../../../Util/secondsToDhms';
import getISOTime from '../../../Util/getISOTime';

const Row = props => {
  const { id, title, users } = props.project;
  const user = users[0];
  const Transcripts = new Collection(props.firebase, `projects/${ id }/transcripts`);
  const Uploads = new Collection(props.firebase, `users/${ user }/uploads`);
  const [ transcripts, setTranscripts ] = useState();
  const [ uploads, setUploads ] = useState();

  useEffect(() => {
    const getTranscripts = async () => {
      try {
        const allTranscripts = await Transcripts.getCollection();
        setTranscripts(allTranscripts);
      } catch (e) {
        console.error('Could not get Transcripts: ', e);
        setTranscripts([]);
      }
    };

    if (!transcripts) {
      getTranscripts();
    }

    return () => {
    };
  }, [ transcripts, Transcripts ]);

  useEffect(() => {
    const getUploadsMetadata = async () => {
      try {
        const allTranscriptsUploads = await Promise.all(transcripts.map(transcript => Uploads.getItem(transcript.id)));
        setUploads(allTranscriptsUploads);
      } catch (e) {
        console.error('Could not get Project Id: ', e);
        setUploads([]);
      }
    };

    if (transcripts && !uploads) {
      getUploadsMetadata();
    }

    return () => {
    };
  }, [ uploads, Uploads, transcripts ]);

  const getStatusBadge = (status) => {
    let variant = 'info';
    if (status === 'error' || status === 'fail') {
      variant = 'danger';
    } else if (status === 'done') {
      variant = 'success';
    }

    return (
      <Badge variant={ variant }>
        {status}
      </Badge>
    );
  };

  const getRows = () => transcripts.map((tr, trIndex) => {
    const { id: transcriptId, media, message, projectId, runtime, title: transcriptTitle, status, created, updated } = tr;
    const { duration, size } = uploads[trIndex];

    const dhmsRuntime = runtime ? ToDhmsCompact(runtime.runtimeByNano / 1000) : '';
    const firstCreated = created ? getISOTime(created.seconds) : '';
    const lastUpdated = updated ? getISOTime(updated.seconds) : '';

    return (
      <tr key={ transcriptId }>
        <td>
          {getStatusBadge(status)}
        </td>
        <td>
          {message}
        </td>
        <td>
          {firstCreated}
        </td>
        <td>
          {lastUpdated}
        </td>
        <td>
          <a href={ `https://console.firebase.google.com/u/1/project/newslabs-dev-aa20/functions/logs?search=${ transcriptId }&&severity=DEBUG` } rel={ 'noopener noreferrer' } target={ '_blank' }>
            {transcriptId}
          </a>
        </td>
        <td>
          {transcriptTitle}
        </td>
        <td>
          {projectId}
        </td>
        <td>
          {title}
        </td>
        <td>
          {dhmsRuntime}
        </td>
        <td>
          {ToDhmsCompact(duration)}
        </td>
        <td>
          {size}
        </td>
        <td>
          {media.ref}
        </td>
        <td>
          {media.type}
        </td>
      </tr>
    );
  });

  return (
    <>
      { transcripts && transcripts.length && uploads && uploads.length ? getRows() : [] }
    </>
  );
};

Row.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  }),
  user: PropTypes.any
};

export default Row;
