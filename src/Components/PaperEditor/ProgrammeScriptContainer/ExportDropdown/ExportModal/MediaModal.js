import PropTypes from 'prop-types';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload
} from '@fortawesome/free-solid-svg-icons';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import download from 'downloadjs';

/* TODO: Feedback on download progress(?) - this takes a few seconds for a one-minute
video, so I think there is definitely optimization that needs to happen here -
possibly with chunking uploads / downloads, etc */

const handleClick = (url, fileName, type) => {
  const x = new XMLHttpRequest();
  x.open('GET', url, true);
  x.responseType = 'blob';
  x.onload = function() {
    download(x.response, fileName, type);
  };
  x.send();
};

const MediaModal = (props) => {

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Download Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.urls.map(({ name, url, fileName, type }) => (
          <li key={ name }>Title:{name}{' '}
            <Button onClick={ () => handleClick(url, fileName, type) }>Download{' '}
              <FontAwesomeIcon icon={ faDownload } />
            </Button>
          </li>))
        }
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={ props.handleClose }>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

};

MediaModal.propTypes = {
  handleClose: PropTypes.any,
  show: PropTypes.any,
  urls: PropTypes.any
};
export default MediaModal;
