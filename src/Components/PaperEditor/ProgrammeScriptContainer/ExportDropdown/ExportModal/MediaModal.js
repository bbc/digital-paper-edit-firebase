import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload
} from '@fortawesome/free-solid-svg-icons';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import styles from './index.module.css';

import download from 'downloadjs';

const DownloadItem = ({ name, fileName, url, type }) => {
  const [ isDownloading, setIsDownloading ] = useState(false);
  const [ progress, setProgress ] = useState();

  const handleProgress = (e) => {
    if (e.lengthComputable) {
      setProgress(Math.round((e.loaded / e.total) * 100));
    }
  };

  const handleClick = () => {
    const x = new XMLHttpRequest();
    x.addEventListener('loadstart', setIsDownloading(true));
    x.addEventListener('progress', handleProgress);
    x.open('GET', url, true);
    x.responseType = 'blob';
    x.onload = function () {
      download(x.response, fileName, type);
      setIsDownloading(false);
    };
    x.send();
  };

  const getStatus = () => {
    if (isDownloading) {
      return (
        <span className={ styles.status }>Downloading... { progress }%</span>
      );
    }
  };

  return (
    <li key={ name } className={ styles.mediaItem }>
      <Button
        variant="outline-primary"
        size="sm"
        disabled={ isDownloading }
        onClick={ () => handleClick(url, fileName, type) }>
        <FontAwesomeIcon icon={ faDownload } />
      </Button>
      <p className={ styles.mediaName }>{name}</p>
      {getStatus()}
    </li>
  );
};

const MediaModal = (props) => {

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Download Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.urls.map(({ name, url, fileName, type }) => (
          <DownloadItem
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

DownloadItem.propTypes = {
  name: PropTypes.string,
  fileName: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string
};

export default MediaModal;
