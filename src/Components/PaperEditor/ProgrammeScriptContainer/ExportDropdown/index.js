import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

/* ExportFormModal is not a real library yet, we would need to
publish ExportFormModal is on the branch in Storybook.
What I've shown previously was using FormModal from the Storybook */

// import ExportFormModal from '@bbc/digital-paper-edit-storybook/ExportFormModal';
import EDL from 'edl_composer';
import generateADL from '@bbc/aes31-adl-composer';
import jsonToFCPX from '@bbc/fcpx-xml-composer';
import downloadjs from 'downloadjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShare,
  faInfoCircle,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';
import timecodes from 'node-timecodes';

const ExportDropdown = (props) => {

  const defaultReelName = 'NA';
  const defaultFps = 25;
  const defaultTimecodeOffset = '00:00:00:00';
  const defaultSampleRate = '16000';

  const title = props.title;
  const elements = props.elements;
  const transcripts = props.transcripts;

  const initialFormState = [ {
    fileName: '',
    srcFolderPath: ''
  } ];

  const [ showModal, setShowModal ] = useState(false);
  const [ formData, setFormData ] = useState(initialFormState);
  const [ exportFormat, setExportFormat ] = useState('');

  // These aren't updating in enough time for their values to be used in the functions they're
  // needed in, which is weird!
  const [ exportPath, setExportPath ] = useState('');
  const [ filePaths, setFilePaths ] = useState(null);

  // /**
  //  * Helper function to create json EDL for other EDL/ADL/FPCX export
  //  */

  const getCurrentTranscript = (element) => transcripts.find(tr => {
    return tr.id === element.transcriptId;
  });

  const getSequenceJsonEDL = (filesExport) => {
    const edlSq = {
      title: title,
      events: []
    };

    const programmeScriptPaperCuts = elements
      .map(element => {
        if (element.type === 'paper-cut') {
          // Get clipName for current transcript

          const currentTranscript = getCurrentTranscript(element);

          const currentFile = filesExport.find((file) => {
            return file.fileName === currentTranscript.title;
          });

          const currentFileExportPath = currentFile.srcFolderPath;

          const result = {
            startTime: element.start,
            endTime: element.end,
            reelName: currentTranscript.metadata
              ? currentTranscript.metadata.reelName
              : defaultReelName,
            clipName: currentFileExportPath,
            // TODO: frameRate should be pulled from the clips in the sequence
            // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
            // but again frameRate should not be hard coded
            fps: currentTranscript.metadata
              ? currentTranscript.metadata.fps
              : defaultFps,
            // TODO: if there is an offset this should added here, for now hard coding 0
            offset: currentTranscript.metadata
              ? currentTranscript.metadata.timecode
              : defaultTimecodeOffset,
            sampleRate: currentTranscript.metadata
              ? currentTranscript.metadata.sampleRate
              : defaultSampleRate
          };

          return result;
        }

        return null;
      })
      .filter(el => {
        return el !== null;
      });
    // adding ids to EDL
    const programmeScriptPaperCutsWithId = programmeScriptPaperCuts.map(
      (el, index) => {
        el.id = index + 1;

        return el;
      }
    );
    edlSq.events.push(...programmeScriptPaperCutsWithId);

    return edlSq;
  };

  const getEDL = (edlSq) => {
    const edl = new EDL(edlSq);
    downloadjs(edl.compose(), `${ title }.edl`, 'text/plain');
  };

  const getADL = (edlSq) => {
    console.log('edlSeq: : ', edlSq);
    if (edlSq.events.length === 0) {
      alert('Cannot export empty paper edit ADL');

      return;
    }
    const firstElement = edlSq.events[0];
    const result = generateADL({
      projectOriginator: 'Digital Paper Edit',
      // TODO: it be good to change sequence for the ADL to be same schema
      // as the one for EDL and FCPX - for now just adjusting
      edits: edlSq.events.map(event => {
        console.log('ADL event: : ', event);

        return {
          start: event.startTime,
          end: event.endTime,
          clipName: event.clipName,
          // TODO: could add a label if present
          label: ''
        };
      }),
      sampleRate: firstElement.sampleRate,
      frameRate: firstElement.fps,
      projectName: edlSq.title
    });
    console.log('ADL Result', result);
    downloadjs(result, `${ title }.adl`, 'text/plain');
  };

  const handleSaveForm = item => {
    const scriptExport = item.exportPath;
    const filesExport = item.files;
    setExportPath(scriptExport);
    setFilePaths(filesExport);
    const edlSq = getSequenceJsonEDL(filesExport);

    if (exportFormat === 'EDL') {
      getEDL(edlSq);
    } else if (exportFormat === 'ADL') {
      getADL(edlSq);
    }

    setShowModal(false);
    setFormData(initialFormState);
  };

  const toggleShowModal = () => {
    setShowModal(!showModal);
  };

  const handleOnHide = () => {
    setShowModal(false);
  };

  const updateFormData = () => {
    const exportOptions = elements.reduce(
      (elementsTracker, element) => {
        if (element.type === 'paper-cut' && !(elementsTracker.transcriptIds.includes(element.transcriptId))) {
          const currentTranscript = getCurrentTranscript(element);
          const mediaTitle = currentTranscript.title;

          const exportOption = {
            fileName: mediaTitle,
            srcFolderPath: null
          };

          elementsTracker.elements.push(exportOption);
          elementsTracker.transcriptIds.push(element.transcriptId);
        }

        return elementsTracker;
      }, { elements: [], transcriptIds: [] } );

    setFormData(exportOptions.elements);
  };

  const handleExportEDL = async () => {
    updateFormData();
    toggleShowModal();
    setExportFormat('EDL');
  };

  const handleExportADL = () => {
    updateFormData();
    toggleShowModal();
    setExportFormat('ADL');
  };

  const handleExportFCPX = () => {
    // alert('this function has not been implemented yet');
    const edlSq = getSequenceJsonEDL();
    const result = jsonToFCPX(edlSq);
    console.log('FCPX result', result);
    downloadjs(result, `${ title }.fcpxml`, 'text/plain');
  };

  const getProgrammeScriptJson = () => {
    // alert('this function has not been implemented yet');
    const edlSq = {
      title: title,
      events: []
    };

    const programmeScriptPaperCuts = elements
      .map(element => {
        if (element.type === 'paper-cut') {
          // Get clipName for current transcript
          const currentTranscript = getCurrentTranscript(element);

          const result = {
            ...element,
            startTime: element.start,
            endTime: element.end,
            reelName: currentTranscript.metadata
              ? currentTranscript.metadata.reelName
              : defaultReelName,
            clipName: `${ currentTranscript.clipName }`,
            // TODO: frameRate should be pulled from the clips in the sequence
            // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
            // but again frameRate should not be hard coded
            fps: currentTranscript.metadata
              ? currentTranscript.metadata.fps
              : defaultFps,
            sampleRate: currentTranscript.metadata
              ? currentTranscript.metadata.sampleRate
              : defaultSampleRate,
            offset: currentTranscript.metadata
              ? currentTranscript.metadata.timecode
              : defaultTimecodeOffset
          };

          return result;
        } else {
          return element;
        }
      })
      .filter(el => {
        return el !== null;
      });
    // adding ids to EDL
    const programmeScriptPaperCutsWithId = programmeScriptPaperCuts.map(
      (el, index) => {
        el.id = index + 1;

        return el;
      }
    );
    edlSq.events.push(...programmeScriptPaperCutsWithId);

    return edlSq;
  };

  const programmeScriptJsonToText = edlsqJson => {
    const edlTitle = `# ${ edlsqJson.title }\n\n`;
    const body = edlsqJson.events.map(event => {
      if (event.type === 'title') {
        return `## ${ event.text }`;
      } else if (event.type === 'voice-over') {
        return `_${ event.text }_`;
      } else if (event.type === 'note') {
        return `[ ${ event.text }]`;
      } else if (event.type === 'paper-cut') {
        return `${ timecodes.fromSeconds(
          event.startTime
        ) }\t${ timecodes.fromSeconds(event.endTime) }\t${ event.speaker }\t-\t${
          event.clipName
        }     \n${ event.words
          .map(word => {
            return word.text;
          })
          .join(' ') }`;
      }

      return null;
    });

    return `${ edlTitle }${ body.join('\n\n') }`;
  };

  const handleExportJson = () => {
    const programmeScriptJson = getProgrammeScriptJson();
    const programmeScriptText = JSON.stringify(programmeScriptJson, null, 2);
    downloadjs(
      programmeScriptText,
      `${ title }.json`,
      'text/plain'
    );
  };

  const handleExportTxt = () => {
    const programmeScriptJson = getProgrammeScriptJson();
    const programmeScriptText = programmeScriptJsonToText(programmeScriptJson);
    console.log('Programme Script Text: ', programmeScriptText);
    downloadjs(
      programmeScriptText,
      `${ title }.txt`,
      'text/plain'
    );
  };

  return (
    <>
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
            ADL - Audio <FontAwesomeIcon icon={ faInfoCircle } />
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
            onClick={ () => {
              alert('export word doc not implemented yet');
            } }
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
        </Dropdown.Menu>
      </Dropdown>

      <ExportFormModal
        items={ formData }
        modalTitle={ 'Export' }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
      />
    </>
  );

};

ExportDropdown.propTypes = {
  elements: PropTypes.any,
  title: PropTypes.any,
  transcripts: PropTypes.any
};

export default ExportDropdown;