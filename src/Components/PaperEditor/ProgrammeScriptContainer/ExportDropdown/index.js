import PropTypes from 'prop-types';
import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import jsonToFCPX from '@bbc/fcpx-xml-composer';
import downloadjs from 'downloadjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShare,
  faInfoCircle,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';

import ADLModal from './ExportModal/ADLModal';
import MediaModal from './ExportModal/MediaModal';
import EDL from 'edl_composer';
import { getEDLSq, getADLSq } from './edl';
import { formatJsonToText, getJson } from './json';
import { useState } from 'react';
import programmeScriptJsonToDocx from './programme-script-json-to-docx';

const ExportDropdown = ({ title, elements, transcripts, projectTitle, storage, trackEvent, handleGetMediaUrl }) => {

  const [ showADL, setShowADL ] = useState(false);
  const [ showMedia, setShowMedia ] = useState(false);

  const [ urls, setUrls ] = useState([]);

  const handleCloseADL = () => setShowADL(false);
  const handleShowADL = () => setShowADL(true);
  const handleCloseMedia = () => setShowMedia(false);
  const handleShowMedia = () => setShowMedia(true);

  const handleExportFCPX = () => {
    const edlSq = getEDLSq(title, elements, transcripts);
    const result = jsonToFCPX(edlSq);
    console.log('FCPX result', result);
    downloadjs(result, `${ title }.fcpxml`, 'text/plain');
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `FCPX: ${ title }` });
  };

  const handleExportJson = () => {
    const programmeScriptJson = getJson(title, elements, transcripts);
    const programmeScriptText = JSON.stringify(programmeScriptJson, null, 2);
    downloadjs(
      programmeScriptText,
      `${ title }.json`,
      'text/plain'
    );
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `JSON: ${ title }` });
  };

  const handleExportTxt = () => {
    const programmeScriptJson = getJson(title, elements, transcripts);
    const programmeScriptText = formatJsonToText(programmeScriptJson);
    console.log('Programme Script Text: ', programmeScriptText);
    downloadjs(
      programmeScriptText,
      `${ title }.txt`,
      'text/plain'
    );
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `text file: ${ title }` });
  };

  const handleExportEDL = () => {
    const edlSq = getEDLSq(title, elements, transcripts);
    const edl = new EDL(edlSq);
    downloadjs(edl.compose(), `${ title }.edl`, 'text/plain');
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `EDL: ${ title }` });
  };

  const generateADL = (data) => {
    const updatedTranscripts = transcripts.map(tr => ( { ...tr, ...data[tr.id] }));
    const result = getADLSq(projectTitle, title, elements, updatedTranscripts);
    downloadjs(result, `${ projectTitle }-${ title }.adl`, 'text/plain');
  };

  const handleExportADL = () => {
    handleShowADL();
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `ADL: ${ title }` });
  };

  const handleExportDocx = () => {
    const programmeScriptJson = getJson(title, elements, transcripts, true);
    programmeScriptJsonToDocx(programmeScriptJson, title, true);
    trackEvent({ category: 'programme script - programme script panel', action: 'export', name: `word document: ${ title }` });
  };

  const getMediaUrl = async (item) => {

    return handleGetMediaUrl(storage, item);
  };

  const handleDownloadMedia = async () => {
    const trUrls = await Promise.all(transcripts.map(async tr => {
      return {
        name: tr.title,
        fileName: tr.title,
        url: await getMediaUrl(tr.media),
        type: tr.media.type,
      };
    }));
    setUrls(trUrls);
    handleShowMedia();
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary">
        <FontAwesomeIcon icon={ faShare } /> Export
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          onClick={ handleExportEDL }
          title="export EDL, edit decision list, to import the programme script as a sequence in video editing software - Avid, Premiere, Davinci Resolve, for FCPX choose FCPX XML"
        >
          EDL - Video <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ handleExportADL }
          title="export ADL, audio decision list, to import the programme script as a sequence in audio editing software such as SADiE"
        >
          <FontAwesomeIcon icon={ faFileExport } />
          ADL - Audio / SaDiE <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ handleExportFCPX }
          title="export FCPX XML, to import the programme script as a sequence in Final Cut Pro X, video editing software"
        >
          FCPX <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={ handleExportTxt }
          title="export Text, export the programme script as a text version"
        >
          Text File <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ handleExportDocx }
          title="export docx, export the programme script as a word document"
        >
          Word Document <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={ handleExportJson }
          title="export Json, export the programme script as a json file"
        >
          Json <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ handleDownloadMedia }
          title="save original media files">
          Download Media files <FontAwesomeIcon icon={ faInfoCircle } />
        </Dropdown.Item>

        <ADLModal show={ showADL } onSubmit={ generateADL } transcripts={ transcripts } handleClose={ handleCloseADL } />
        { urls.length > 0
          ? <MediaModal urls={ urls } show={ showMedia } handleClose={ handleCloseMedia } trackEvent= { trackEvent } />
          : null }
      </Dropdown.Menu>
    </Dropdown>
  );

};

ExportDropdown.propTypes = {
  elements: PropTypes.any,
  handleGetMediaUrl: PropTypes.func,
  projectTitle: PropTypes.any,
  title: PropTypes.any,
  transcripts: PropTypes.any,
  storage: PropTypes.object,
  trackEvent: PropTypes.func
};

export default ExportDropdown;
