import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import download from 'downloadjs';

const MediaModalFiles = ({ name, fileName, url, type }) => {
  const [ isDownloading, setIsDownloading ] = useState(false);
  const [ progress, setProgress ] = useState();

  const handleProgress = (e) => {
    if (e.lengthComputable) {
      setProgress(Math.round((e.loaded / e.total) * 100));
    }
  };

  const handleClick = () => {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener('loadstart', setIsDownloading(true));
    xmlhttp.addEventListener('progress', handleProgress);
    xmlhttp.open('GET', url, true);
    xmlhttp.responseType = 'blob';
    xmlhttp.onload = function () {
      download(xmlhttp.response, fileName, type);
      setIsDownloading(false);
    };
    xmlhttp.send();
  };

  const getStatus = () => {
    if (isDownloading) {
      return (
        <span style={ { textAlign: 'right', fontSize: '.85rem', marginLeft: '.85rem' } }>
          Downloading... { progress}%
        </span>
      );
    }
  };

  return (
    <li key={ name } style={ { listStyle: 'none', margin: '.85rem 0' } }>
      <Button
        variant="outline-primary"
        size="sm"
        disabled={ isDownloading }
        onClick={ () => handleClick(url, fileName, type) }>
        <FontAwesomeIcon icon={ faDownload } />
      </Button>
      <p style={ { marginLeft: '.65rem', display: 'inline-block' } }>{name}</p>
      {getStatus()}
    </li>
  );
};

MediaModalFiles.propTypes = {
  name: PropTypes.string,
  fileName: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string
};

export default MediaModalFiles;