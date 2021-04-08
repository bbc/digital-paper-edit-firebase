import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload
} from '@fortawesome/free-solid-svg-icons';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import download from 'downloadjs';

const MediaModal = (props) => {
  const [ progress, setProgress ] = useState();
  const [ isDownloading, setIsDownloading ] = useState([]);

  const handleProgress = (fileName, event) => {
    if (event.lengthComputable) {
      setProgress(Math.round((event.loaded / event.total) * 100));
    }
  };

  const addDownloads = (fileName) => {
    console.log(isDownloading);
    const downloads = [];
    downloads.push(fileName);
    console.log('downloads', downloads);
    setIsDownloading(downloads);
  };

  const removeDownloads = (fileName) => {
    const downloads = isDownloading.filter((media) => media != fileName);
    setIsDownloading(downloads);
    setProgress(0);

  };

  const handleClick = (url, fileName, type) => {
    console.log(isDownloading);
    const x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.responseType = 'blob';
    x.addEventListener('loadstart', addDownloads(fileName));
    x.addEventListener('progress', handleProgress(fileName));
    x.onload = function () {
      download(x.response, fileName, type);
      removeDownloads(fileName);
    };
    x.send();
  };

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Download Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.urls.map(({ name, url, fileName, type }) => (
          <li key={ name }>
            <Button onClick={ () => handleClick(url, fileName, type) }>
              <FontAwesomeIcon icon={ faDownload } />
            </Button>
            {name}{' '}
            {isDownloading.length && isDownloading.includes(fileName) ? (`Downloading... ${ progress }%`) : ''}
            <>
            </>
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
