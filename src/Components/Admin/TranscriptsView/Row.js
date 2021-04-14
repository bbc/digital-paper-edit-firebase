import PropTypes from 'prop-types';
import React from 'react';
import Badge from 'react-bootstrap/Badge';
import { ToDhmsCompact, getISOTime } from '../../../Util/time';

const Row = ({
  title,
  transcriptId,
  media,
  message,
  projectId,
  runtime,
  transcriptTitle,
  status,
  created,
  updated,
  duration,
  size,
}) => {

  const dhmsRuntime = runtime
    ? ToDhmsCompact(runtime.runtimeByNano / 1000)
    : '';
  const firstCreated = created ? getISOTime(created.seconds) : '';
  const lastUpdated = updated ? getISOTime(updated.seconds) : '';

  const getStatusBadge = () => {
    let variant = 'info';
    if (status === 'error' || status === 'fail') {
      variant = 'danger';
    } else if (status === 'done') {
      variant = 'success';
    }

    return <Badge variant={ variant }>{status}</Badge>;
  };

  return (
    <tr key={ transcriptId }>
      <td>{getStatusBadge(status)}</td>
      <td>{message}</td>
      <td>{firstCreated}</td>
      <td>{lastUpdated}</td>
      <td>
        <a
          href={ `https://console.firebase.google.com/u/1/project/newslabs-dev-aa20/functions/logs?search=${ transcriptId }&&severity=DEBUG` }
          rel={ 'noopener noreferrer' }
          target={ '_blank' }
        >
          {transcriptId}
        </a>
      </td>
      <td>{transcriptTitle}</td>
      <td>{projectId}</td>
      <td>{title}</td>
      <td>{dhmsRuntime}</td>
      <td>{ToDhmsCompact(duration)}</td>
      <td>{size}</td>
      <td>{media ? media.ref : ''}</td>
      <td>{media ? media.type : ''}</td>
    </tr>
  );
};

Row.propTypes = {
  created: PropTypes.shape({
    seconds: PropTypes.any
  }),
  duration: PropTypes.any,
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  }),
  media: PropTypes.shape({
    ref: PropTypes.any,
    type: PropTypes.any
  }),
  message: PropTypes.any,
  projectId: PropTypes.any,
  runtime: PropTypes.shape({
    runtimeByNano: PropTypes.number
  }),
  size: PropTypes.any,
  status: PropTypes.string,
  title: PropTypes.any,
  transcriptId: PropTypes.any,
  transcriptTitle: PropTypes.any,
  updated: PropTypes.shape({
    seconds: PropTypes.any
  }),
  user: PropTypes.any
};

export default Row;
