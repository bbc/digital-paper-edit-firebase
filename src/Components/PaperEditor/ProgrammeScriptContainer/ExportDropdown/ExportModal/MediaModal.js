import PropTypes from 'prop-types';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload
} from '@fortawesome/free-solid-svg-icons';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import download from 'downloadjs';

const handleClick = (url, fileName) => {
  download(url, fileName, 'application/octet-stream');
};

const MediaModal = (props) => {

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Download Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.urls.map(({ name, url, fileName }) => (
          <li key={ name }>Title:{name}{' '}
            <Button onClick={ () => handleClick(url, fileName) }>Download{' '}
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
