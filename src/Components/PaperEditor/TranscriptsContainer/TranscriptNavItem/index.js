import PropTypes from 'prop-types';
import React from 'react';
import Nav from 'react-bootstrap/Nav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

const TranscriptNavItem = (props) => {
  const getStatusIcon = (status) => {
    if (status === 'in-progress') {
      return <FontAwesomeIcon icon={ faClock } />;
    } else if (status === 'error') {
      return <FontAwesomeIcon icon={ faExclamationTriangle } />;
    } else {
      return '';
    }
  };

  return (
    <Nav.Item>
      <Nav.Link
        disabled={ props.status !== 'done' ? true : false }
        eventKey={ props.id }
      >
        {getStatusIcon(props.status)}
        {`  ${ props.title }`}
      </Nav.Link>
    </Nav.Item>
  );
};

TranscriptNavItem.propTypes = {
  id: PropTypes.any,
  status: PropTypes.string,
  title: PropTypes.any,
};

export default TranscriptNavItem;
