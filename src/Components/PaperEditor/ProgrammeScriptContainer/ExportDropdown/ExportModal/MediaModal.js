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
  const [ progress, setProgress ] = useState([]);
  const [ isDownloading, setIsDownloading ] = useState([]);

  const handleProgress = (e, fileName) => {
    const filesProgress = progress;
    if (e.lengthComputable) {
      if (!(progress.find((item) => item.fileName == fileName))) {
        filesProgress.push({
          fileName,
          progress: Math.round((e.loaded / e.total) * 100)
        });
        setProgress(filesProgress);
      } else {
        const filteredFiles = progress.filter((item) => item.fileName != fileName);
        filteredFiles.push({
          fileName,
          progress: Math.round((e.loaded / e.total) * 100)
        });
        setProgress(filteredFiles);
      }
    }
  };

  const addDownloads = (fileName) => {
    const downloads = isDownloading;
    downloads.push(fileName);
    setIsDownloading(downloads);
  };

  const removeDownloads = (fileName) => {
    const downloads = isDownloading.filter((media) => media != fileName);
    const removeFileProgress = progress.filter((file) => file.fileName != fileName);
    setIsDownloading(downloads);
    setProgress(removeFileProgress);
  };

  const handleClick = (url, fileName, type) => {
    const x = new XMLHttpRequest();
    x.addEventListener('loadstart', addDownloads(fileName));
    x.addEventListener('progress', e => handleProgress(e, fileName));
    x.open('GET', url, true);
    x.responseType = 'blob';
    x.onload = function () {
      download(x.response, fileName, type);
      removeDownloads(fileName);
    };
    x.send();
  };

  const getProgress = (fileName) => {
    const file = progress.find((media) => fileName === media.fileName);
    if (file) {
      return file.progress;
    }

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
            {isDownloading.length && isDownloading.includes(fileName) ? (`Downloading... ${ getProgress(fileName) }%`) : ''}
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
