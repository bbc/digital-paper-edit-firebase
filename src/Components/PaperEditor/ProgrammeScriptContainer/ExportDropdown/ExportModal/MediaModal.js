import PropTypes from 'prop-types';
import React from 'react';

import Modal from 'react-bootstrap/Modal';

import MediaModalFiles from './MediaModalFiles';

const MediaModal = (props) => {

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Download Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.urls.map(({ name, url, fileName, type }) => (
          <MediaModalFiles
            key={ fileName }
            name={ name }
            url={ url }
            fileName={ fileName }
            type={ type }/>
        ))}
      </Modal.Body>
    </Modal>
  );

};

MediaModal.propTypes = {
  handleClose: PropTypes.any,
  show: PropTypes.any,
  urls: PropTypes.any
};

export default MediaModal;
