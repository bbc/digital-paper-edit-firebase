import React, { useRef, useState, useEffect } from 'react';
import { withAuthorization } from '../../Session';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import cuid from 'cuid';
import PreviewCanvas from '@bbc/digital-paper-edit-storybook/PreviewCanvas';
import ProgrammeScriptContainer from '@bbc/digital-paper-edit-storybook/ProgrammeScriptContainer';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import EDL from 'edl_composer';
import generateADL from '@bbc/aes31-adl-composer';
import jsonToFCPX from '@bbc/fcpx-xml-composer';
import downloadjs from 'downloadjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import {
  faShare,
  faMicrophoneAlt,
  faStickyNote,
  faHeading,
  faPlus,
  faSync,
  faInfoCircle,
  faSave,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';
import timecodes from 'node-timecodes';
import getDataFromUserWordsSelection from './get-data-from-user-selection.js';
import {
  divideWordsSelectionsIntoParagraphs,
  isOneParagraph
} from './divide-words-selections-into-paragraphs';

import Collection from '../../Firebase/Collection';

const defaultReelName = 'NA';
const defaultFps = 25;
const defaultTimecodeOffset = '00:00:00:00';
const defaultSampleRate = '16000';

const ProgrammeScript = props => {
  const transcripts = props.transcripts;
  const papereditsId = props.match.params.papereditId;
  const projectId = props.match.params.projectId;
  const previewCardRef = useRef(null);

  const [programmeScript, updateProgrammeScript] = useState(null);
  const [resetPreview, toggleResetPreview] = useState(false);
  const [width, updateWidth] = useState(150);
  const [playlist, updatePlaylist] = useState();

  const getTranscript = transcriptId => {
    return transcripts.find(tr => tr.id === transcriptId);
  };

  const getPlayList = () => {
    let startTime = 0;

    return programmeScript.elements
      .filter(element => element.type === 'paper-cut')
      .map(element => {
        console.log('paper cut element: ', element);
        const transcript = getTranscript(element.transcriptId);
        const result = {
          type: 'video',
          start: startTime,
          sourceStart: element.start,
          duration: element.end - element.start,
          src: transcript.url
        };

        startTime += result.duration;

        return result;
      });
  };

  const PaperEditsCollection = new Collection(
    props.firebase,
    `/projects/${projectId}/paperedits`
  );

  useEffect(() => {
    const getPaperEdit = async () => {
      try {
        const data = await PaperEditsCollection.getItem(papereditsId);
        const paperEditProgrammeScript = {};
        paperEditProgrammeScript.title = data.title;
        paperEditProgrammeScript.elements = data.elements;
        paperEditProgrammeScript.elements.push({
          type: 'insert',
          text: 'Insert point to add selection'
        });
        updateProgrammeScript(paperEditProgrammeScript);
        toggleResetPreview(true);
      } catch (error) {
        console.error('Error getting paper edits: ', error);
      }
    };

    const updateVideoContextWidth = () => {
      const recalcWidth = previewCardRef.current.offsetWidth - 10;
      updateWidth(recalcWidth);
    };

    window.addEventListener('resize', updateVideoContextWidth);

    if (!programmeScript) {
      getPaperEdit();
    }
  }, [
    PaperEditsCollection,
    previewCardRef.offsetWidth,
    papereditsId,
    programmeScript,
    resetPreview,
    props.programmeScript
  ]);

  const handleUpdatePreview = () => {
    const currentPlaylist = getPlayList();
    // [old comment]: Workaround to mound and unmount the `PreviewCanvas` component
    // to update the playlist
    updatePlaylist(currentPlaylist);
  };

  const handleResetPreview = () => {
    handleUpdatePreview();
    toggleResetPreview(!resetPreview);
  };

  // TODO: handleReorder and handleDelete aren't working. Figure out how to update the StoryBook element.
  const handleReorder = () => {
    console.log('Handling reorder....');
    const tempScript = programmeScript;
    // tempScript.elements = list;

    return updateProgrammeScript(tempScript);
  };

  const handleDelete = i => {
    console.log('Handling delete');
    // TODO: add a prompt, like are you shure you want to delete, confirm etc..?
    // alert('handle delete');
    const tempScript = programmeScript;
    const index = i;
    const list = tempScript.elements;
    list.splice(index, i);
    updateProgrammeScript(tempScript);
    resetPreview(true);
  };

  const getIndexPositionOfInsertPoint = () => {
    const elements = programmeScript.elements;
    const insertPointElement = elements.find(el => {
      return el.type === 'insert';
    });
    const indexOfInsertPoint = elements.indexOf(insertPointElement);

    return indexOfInsertPoint;
  };

  const handleAddTranscriptElementToProgrammeScript = elementType => {
    const tempProgrammeScript = programmeScript;
    const elements = programmeScript.elements;
    // [old comment]: TODO: refactor - with helper functions
    if (
      elementType === 'title' ||
      elementType === 'note' ||
      elementType === 'voice-over'
    ) {
      const text = prompt(
        'Add some text for a section title',
        'Some place holder text'
      );

      const indexOfInsertPoint = getIndexPositionOfInsertPoint();
      const newElement = {
        id: cuid(),
        index: elements.length,
        type: elementType,
        text: text
      };
      elements.splice(indexOfInsertPoint, 0, newElement);
      tempProgrammeScript.elements = elements;
      // [old comment]: TODO: save to server (should this only be if the 'Save' button is clicked?)

      updateProgrammeScript(tempProgrammeScript); // This doesn't trigger a refresh...
    }
  };

  // /**
  //  * Helper function to create json EDL for other EDL/ADL/FPCX export
  //  */

  const getSequenceJsonEDL = () => {
    const edlSq = {
      title: programmeScript.title,
      events: []
    };

    const programmeScriptPaperCuts = programmeScript.elements
      .map(element => {
        if (element.type === 'paper-cut') {
          // Get clipName for current transcript
          const currentTranscript = transcripts.find(tr => {
            return tr.id === element.transcriptId;
          });

          const result = {
            startTime: element.start,
            endTime: element.end,
            reelName: currentTranscript.metadata
              ? currentTranscript.metadata.reelName
              : defaultReelName,
            clipName: `${currentTranscript.clipName}`,
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

          console.log('EDL - result 1', result);

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

    console.log('EDL Seq', edlSq);

    return edlSq;
  };

  // // TODO: save to server
  // handleDelete = i => {
  //   // TODO: add a prompt, like are you shure you want to delete, confirm etc..?
  //   // alert('handle delete');
  //   this.setState(({ programmeScript }) => {
  //     const index = i;
  //     const list = programmeScript.elements;
  //     list.splice(index, 1);
  //     programmeScript.elements = list;

  //     return {
  //       programmeScript: programmeScript,
  //       resetPreview: true
  //     };
  //   });
  // };

  // handleEdit = i => {
  //   const { programmeScript } = this.state;
  //   const elements = programmeScript.elements;
  //   const currentElement = elements[i];
  //   const newText = prompt('Edit', currentElement.text);
  //   if (newText) {
  //     currentElement.text = newText;
  //     elements[i] = currentElement;
  //     programmeScript.elements = elements;
  //     // TODO: save to server
  //     this.setState({
  //       programmeScript: programmeScript,
  //       resetPreview: true
  //     });
  //     // TODO: consider using set state function to avoid race condition? if needed?
  //     // this.setState(({ programmeScript }) => {
  //     //   return {
  //     //     programmeScript: programmeScript
  //     //   };
  //     // });
  //   }
  // };
  // // TODO: save to server
  // // TODO: needs to handle when selection spans across multiple paragraphs
  // handleAddTranscriptSelectionToProgrammeScript = () => {
  //   const result = getDataFromUserWordsSelection();
  //   if (result) {
  //     // result.words
  //     // TODO: if there's just one speaker in selection do following
  //     // if it's multiple split list of words into multiple groups
  //     // and add a papercut for each to the programme script
  //     const { programmeScript } = this.state;
  //     const elements = programmeScript.elements;
  //     // TODO: insert at insert point

  //     const indexOfInsertPoint = this.getIndexPositionOfInsertPoint();
  //     let newElement;
  //     if (isOneParagraph(result.words)) {
  //       // create new element
  //       // TODO: Create new element could be refactored into helper function
  //       newElement = {
  //         id: cuid(),
  //         index: elements.length,
  //         type: 'paper-cut',
  //         start: result.start,
  //         end: result.end,
  //         speaker: result.speaker,
  //         words: result.words,
  //         transcriptId: result.transcriptId,
  //         labelId: []
  //       };
  //     } else {
  //       const paragraphs = divideWordsSelectionsIntoParagraphs(result.words);
  //       paragraphs.reverse().forEach(paragraph => {
  //         newElement = {
  //           id: cuid(),
  //           index: elements.length,
  //           type: 'paper-cut',
  //           start: paragraph[0].start,
  //           end: paragraph[paragraph.length - 1].end,
  //           speaker: paragraph[0].speaker,
  //           words: paragraph,
  //           transcriptId: paragraph[0].transcriptId,
  //           // TODO: ignoring labels for now
  //           labelId: []
  //         };
  //       });
  //     }
  //     // add element just above of insert point
  //     elements.splice(indexOfInsertPoint, 0, newElement);
  //     programmeScript.elements = elements;
  //     // TODO: save to server
  //     this.setState({
  //       programmeScript: programmeScript,
  //       resetPreview: true
  //     });
  //   } else {
  //     alert(
  //       'Select some text in the transcript to add to the programme script'
  //     );
  //     console.log('nothing selected');
  //   }
  // };

  // // https://www.npmjs.com/package/downloadjs
  // // https://www.npmjs.com/package/edl_composer
  const handleExportEDL = () => {
    const edlSq = getSequenceJsonEDL();
    const edl = new EDL(edlSq);
    console.log(edl.compose());
    downloadjs(edl.compose(), `${programmeScript.title}.edl`, 'text/plain');
  };

  const handleExportADL = () => {
    // alert('this function has not been implemented yet');
    const edlSq = getSequenceJsonEDL();
    const firstElement = edlSq.events[0];
    // const result = generateADL(edlSq);
    const result = generateADL({
      projectOriginator: 'Digital Paper Edit',
      // TODO: it be good to change sequence for the ADL to be same schema
      // as the one for EDL and FCPX - for now just adjusting
      edits: edlSq.events.map(event => {
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
    downloadjs(result, `${programmeScript.title}.adl`, 'text/plain');
  };

  const handleExportFCPX = () => {
    // alert('this function has not been implemented yet');
    const edlSq = getSequenceJsonEDL();
    const result = jsonToFCPX(edlSq);
    console.log('FCPX result', result);
    downloadjs(result, `${programmeScript.title}.fcpxml`, 'text/plain');
  };

  const getProgrammeScriptJson = () => {
    // alert('this function has not been implemented yet');
    const edlSq = {
      title: programmeScript.title,
      events: []
    };

    const programmeScriptPaperCuts = programmeScript.elements
      .map(element => {
        if (element.type === 'paper-cut') {
          console.log('paper-cut::', element);
          // Get clipName for current transcript
          const currentTranscript = transcripts.find(tr => {
            return tr.id === element.transcriptId;
          });

          const result = {
            ...element,
            startTime: element.start,
            endTime: element.end,
            reelName: currentTranscript.metadata
              ? currentTranscript.metadata.reelName
              : defaultReelName,
            clipName: `${currentTranscript.clipName}`,
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
    console.log(edlSq);

    return edlSq;
  };

  const programmeScriptJsonToText = edlsqJson => {
    const title = `# ${edlsqJson.title}\n\n`;
    const body = edlsqJson.events.map(event => {
      console.log('EDL events', event);
      if (event.type === 'title') {
        return `## ${event.text}`;
      } else if (event.type === 'voice-over') {
        return `_${event.text}_`;
      } else if (event.type === 'note') {
        return `[ ${event.text}]`;
      } else if (event.type === 'paper-cut') {
        return `${timecodes.fromSeconds(
          event.startTime
        )}\t${timecodes.fromSeconds(event.endTime)}\t${event.speaker}\t-\t${
          event.clipName
        }     \n${event.words
          .map(word => {
            return word.text;
          })
          .join(' ')}`;
      }

      return null;
    });

    return `${title}${body.join('\n\n')}`;
  };

  const handleExportJson = () => {
    const programmeScriptJson = getProgrammeScriptJson();
    const programmeScriptText = JSON.stringify(programmeScriptJson, null, 2);
    downloadjs(
      programmeScriptText,
      `${programmeScript.title}.json`,
      'text/plain'
    );
  };

  const handleExportTxt = () => {
    const programmeScriptJson = getProgrammeScriptJson();
    const programmeScriptText = programmeScriptJsonToText(programmeScriptJson);
    console.log('Programme Script Text: ', programmeScriptText);
    downloadjs(
      programmeScriptText,
      `${programmeScript.title}.txt`,
      'text/plain'
    );
  };

  // handleDoubleClickOnProgrammeScript = e => {
  //   if (e.target.className === 'words') {
  //     const wordCurrentTime = e.target.dataset.start;
  //     // TODO: set current time in preview canvas
  //     // Video context probably needs more info like, which clip/track in the sequence?
  //     // investigate how to set currentTime in video context
  //     console.log('wordCurrentTime::', wordCurrentTime);
  //   }
  // };

  const handleSaveProgrammeScript = async () => {
    const tempProgrammeScript = programmeScript;
    console.log('script', tempProgrammeScript);
    if (programmeScript) {
      const elements = programmeScript.elements;
      // finding an removing insert point before saving to server
      // find insert point in list,
      const insertPointElement = elements.find(el => {
        return el.type === 'insert';
      });
      if (insertPointElement) {
        // get insertpoint index
        const indexOfInsertPoint = elements.indexOf(insertPointElement);
        elements.splice(indexOfInsertPoint, 1);
      }

      programmeScript.elements = elements;

      try {
        await PaperEditsCollection.putItem(
          'ekUGmH6WhnwFnjr0tATO',
          tempProgrammeScript
        );
      } catch (error) {
        console.log('error saving document', error);
      }

      // const programmeScript = json.programmeScript;
      // Adding an insert point at the end of the list
      // programmeScript.elements.push({ type: 'insert-point', text: 'Insert Point to add selection' });
      // this.setState({
      //   programmeScript: programmeScript
      // }
      // TODO: figure out how to update preview
      // , () => {
      //   this.handleUpdatePreview();
      // }
      // );
    }
  };

  // // information around progressbar in the playlist object
  // render() {
  // });

  return (
    <>
      <h2
        className={['text-truncate', 'text-muted'].join(' ')}
        title={`Programme Script Title: ${
          programmeScript ? programmeScript.title : ''
        }`}
      >
        {programmeScript ? programmeScript.title : ''}
      </h2>
      <Card>
        <Card.Header ref={previewCardRef}>
          {!resetPreview ? (
            <PreviewCanvas width={width} playlist={playlist} />
          ) : null}
        </Card.Header>
        <Card.Header>
          <Row noGutters>
            <Col sm={12} md={3}>
              <Button
                // block
                variant="outline-secondary"
                // onClick={ this.handleAddTranscriptSelectionToProgrammeScript }
                title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
              >
                <FontAwesomeIcon icon={faPlus} /> Selection
              </Button>
            </Col>
            <Col sm={12} md={2}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <FontAwesomeIcon icon={faPlus} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      handleAddTranscriptElementToProgrammeScript('title');
                    }}
                    title="Add a title header element to the programme script"
                  >
                    <FontAwesomeIcon icon={faHeading} /> Heading
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      handleAddTranscriptElementToProgrammeScript('voice-over');
                    }}
                    title="Add a title voice over element to the programme script"
                  >
                    <FontAwesomeIcon icon={faMicrophoneAlt} /> Voice Over
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      handleAddTranscriptElementToProgrammeScript('note');
                    }}
                    title="Add a note element to the programme script"
                  >
                    <FontAwesomeIcon icon={faStickyNote} /> Note
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col sm={12} md={3}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <FontAwesomeIcon icon={faShare} /> Export
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={handleExportEDL}
                    title="export EDL, edit decision list, to import the programme script as a sequence in video editing software - Avid, Premiere, Davinci Resolve, for FCPX choose FCPX XML"
                  >
                    EDL - Video <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={handleExportADL}
                    title="export ADL, audio decision list, to import the programme script as a sequence in audio editing software such as SADiE"
                  >
                    <FontAwesomeIcon icon={faFileExport} />
                    ADL - Audio <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={handleExportFCPX}
                    title="export FCPX XML, to import the programme script as a sequence in Final Cut Pro X, video editing software"
                  >
                    FCPX <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={handleExportTxt}
                    title="export Text, export the programme script as a text version"
                  >
                    Text File <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      alert('export word doc not implemented yet');
                    }}
                    title="export docx, export the programme script as a word document"
                  >
                    Word Document <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={handleExportJson}
                    title="export Json, export the programme script as a json file"
                  >
                    Json <FontAwesomeIcon icon={faInfoCircle} />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col sm={12} md={1}>
              <Button
                variant="outline-secondary"
                onClick={handleSaveProgrammeScript}
                // size="sm"
                title="save programme script"
                block
              >
                <FontAwesomeIcon icon={faSave} />
                {/* Save */}
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
          <article
            style={{ height: '60vh', overflow: 'scroll' }}
            // onDoubleClick={ this.handleDoubleClickOnProgrammeScript }
          >
            {programmeScript ? (
              <ProgrammeScriptContainer
                items={programmeScript.elements}
                handleReorder={handleReorder}
                handleDelete={handleDelete}
                // handleEdit={ handleEdit }
              />
            ) : null}
          </article>
        </Card.Body>
      </Card>
    </>
  );
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(ProgrammeScript);
//   }
// }

// <Card>
//   <Card.Header ref={el => (this.card = el)}>
//     {!this.state.resetPreview ? (
//       <PreviewCanvas
//         width={this.state.width}
//         playlist={this.state.playlist}
//       />
//     ) : null}
//   </Card.Header>

//   <Card.Header>
//     <Row noGutters>
//       <Col sm={12} md={3}>
//         <Button
//           // block
//           variant="outline-secondary"
//           onClick={this.handleAddTranscriptSelectionToProgrammeScript}
//           title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
//         >
//           <FontAwesomeIcon icon={faPlus} /> Selection
//                 </Button>
//       </Col>
//       <Col sm={12} md={2}>
//         <Dropdown>
//           <Dropdown.Toggle variant="outline-secondary">
//             <FontAwesomeIcon icon={faPlus} />
//           </Dropdown.Toggle>
//           <Dropdown.Menu>
//             <Dropdown.Item
//               onClick={() => {
//                 this.handleAddTranscriptElementToProgrammeScript(
//                   'title'
//                 );
//               }}
//               title="Add a title header element to the programme script"
//             >
//               <FontAwesomeIcon icon={faHeading} /> Heading
//                     </Dropdown.Item>
//             <Dropdown.Item
//               onClick={() => {
//                 this.handleAddTranscriptElementToProgrammeScript(
//                   'voice-over'
//                 );
//               }}
//               title="Add a title voice over element to the programme script"
//             >
//               <FontAwesomeIcon icon={faMicrophoneAlt} /> Voice Over
//                     </Dropdown.Item>
//             <Dropdown.Item
//               onClick={() => {
//                 this.handleAddTranscriptElementToProgrammeScript(
//                   'note'
//                 );
//               }}
//               title="Add a note element to the programme script"
//             >
//               <FontAwesomeIcon icon={faStickyNote} /> Note
//                     </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//       </Col>
//       <Col sm={12} md={3}>
//         <Dropdown>
//           <Dropdown.Toggle variant="outline-secondary">
//             <FontAwesomeIcon icon={faShare} /> Export
//                   </Dropdown.Toggle>
//           <Dropdown.Menu>
//             <Dropdown.Item
//               onClick={this.handleExportEDL}
//               title="export EDL, edit decision list, to import the programme script as a sequence in video editing software - Avid, Premiere, Davinci Resolve, for FCPX choose FCPX XML"
//             >
//               EDL - Video <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//             <Dropdown.Item
//               onClick={this.handleExportADL}
//               title="export ADL, audio decision list, to import the programme script as a sequence in audio editing software such as SADiE"
//             >
//               {/* <FontAwesomeIcon icon={ faFileExport } />  */}
//                       ADL - Audio <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//             <Dropdown.Item
//               onClick={this.handleExportFCPX}
//               title="export FCPX XML, to import the programme script as a sequence in Final Cut Pro X, video editing software"
//             >
//               FCPX <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//             <Dropdown.Divider />
//             <Dropdown.Item
//               onClick={this.handleExportTxt}
//               title="export Text, export the programme script as a text version"
//             >
//               Text File <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//             <Dropdown.Item
//               onClick={() => {
//                 alert('export word doc not implemented yet');
//               }}
//               title="export docx, export the programme script as a word document"
//             >
//               Word Document <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//             <Dropdown.Divider />
//             <Dropdown.Item
//               onClick={this.handleExportJson}
//               title="export Json, export the programme script as a json file"
//             >
//               Json <FontAwesomeIcon icon={faInfoCircle} />
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//       </Col>
//       <Col sm={12} md={1}>
//         <Button
//           variant="outline-secondary"
//           onClick={this.handleSaveProgrammeScript}
//           // size="sm"
//           title="save programme script"
//           block
//         >
//           <FontAwesomeIcon icon={faSave} />
//           {/* Save */}
//         </Button>
//       </Col>
//     </Row>
//   </Card.Header>

//   <Card.Body>
