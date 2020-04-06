import React, { useRef, useState, useEffect } from 'react';
import cuid from 'cuid';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import arrayMove from 'array-move';
import { SortableContainer, } from 'react-sortable-hoc';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSave,
} from '@fortawesome/free-solid-svg-icons';

import PreviewCanvas from '@bbc/digital-paper-edit-storybook/PreviewCanvas';
import ProgrammeElements from '@bbc/digital-paper-edit-storybook/ProgrammeElements';

import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

import ExportDropdown from './ExportDropdown/index';
import ElementsDropdown from './ElementsDropdown/index';
import getDataFromUserWordsSelection from './get-data-from-user-selection';
import { divideWordsSelectionsIntoParagraphs, isOneParagraph } from './divide-words-selections-into-paragraphs';

import PropTypes from 'prop-types';

const ProgrammeScript = props => {
  const transcripts = props.transcripts;
  const papereditsId = props.match.params.papereditId;
  const projectId = props.match.params.projectId;

  const [ elements, setElements ] = useState();
  const [ title, setTitle ] = useState('');
  const [ resetPreview, setResetPreview ] = useState(false);

  const SortableList = SortableContainer(({ children }) =>
    <ul style={ { listStyle: 'none', padding: '0px' } }>
      {children}
    </ul>
  );
  
  // Video Context Preview
  const [ width, setWidth ] = useState(150);
  const [ playlist, setPlaylist ] = useState();
  const previewCardRef = useRef(null);

  const PaperEditsCollection = new Collection(
    props.firebase,
    `/projects/${ projectId }/paperedits`
  );

  const handleSaveProgrammeScript = async () => {
    console.log('Saving...');
    if (elements) {
      const newElements = JSON.parse(JSON.stringify(elements));
      // finding an removing insert point before saving to server
      // find insert point in list,
      const insertPointElement = newElements.find(el => {
        return el.type === 'insert';
      });
      if (insertPointElement) {
        // get insertpoint index
        const indexOfInsertPoint = newElements.indexOf(insertPointElement);
        newElements.splice(indexOfInsertPoint, 1);
      }

      // Not sure if this is right - probably need to add back a bunch of metadata.
      const paperEditDocument = {
        title: title,
        elements: newElements,
      };

      try {
        await PaperEditsCollection.putItem(
          papereditsId,
          paperEditDocument
        );
        console.log('Successfully saved');
      } catch (error) {
        console.error('Error saving document', error);
      }
    }
  };

  useEffect(() => {
    const getPaperEdit = async () => {
      try {
        const paperEdit = await PaperEditsCollection.getItem(papereditsId);
        setTitle(paperEdit.title);
        const elementsClone = JSON.parse(JSON.stringify(paperEdit.elements));
        const insert = {
          type: 'insert',
          text: 'Insert point to add selection'
        };

        elementsClone.push(insert);
        setElements(elementsClone);
        setResetPreview(true);

      } catch (error) {
        console.error('Error getting paper edits: ', error);
      }
    };

    const getTranscript = transcriptId => {
      return transcripts.find(tr => tr.id === transcriptId);
    };

    const getPlaylist = () => {
      let startTime = 0;

      return elements
        .filter(element => element.type === 'paper-cut')
        .map(element => {
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

    const updateVideoContextWidth = () => {
      setWidth(previewCardRef.current.offsetWidth - 10);
    };

    const handleUpdatePreview = () => {
      // const currentPlaylist = getPlaylist();
      // [old comment]: Workaround to mound and unmount the `PreviewCanvas` component
      // to update the playlist
      const currentPlaylist = [
        {
          'type': 'video',
          'start': 0,
          'sourceStart': 30,
          'duration': 10,
          'src': 'https://download.ted.com/talks/MorganVague_2018X.mp4'
        },
        {
          'type': 'video',
          'start': 10,
          'sourceStart': 40,
          'duration': 10,
          'src': 'https://download.ted.com/talks/IvanPoupyrev_2019.mp4'
        },
        {
          'type': 'video',
          'start': 20,
          'sourceStart': 50,
          'duration': 10,
          'src': 'https://download.ted.com/talks/KateDarling_2018S-950k.mp4'
        }
      ];

      setPlaylist(currentPlaylist);
    };

    window.addEventListener('resize', updateVideoContextWidth);

    if (!elements) {
      getPaperEdit();
    }

    if (resetPreview) {
      handleUpdatePreview();
      setResetPreview(false);
    }

    return () => {
      window.removeEventListener('resize', updateVideoContextWidth);
    };
  },
  [
    PaperEditsCollection,
    elements,
    papereditsId,
    transcripts,
    resetPreview,
  ]);

  const handleReorder = (tempElements) => {
    console.log('Handling reorder...');
    setElements(tempElements);
    resetPreview(true);
    console.log('Reordered');
  };

  const handleDelete = i => {
    console.log('Handling delete...');
    const confirmDelete = window.confirm('Are you sure you want to delete?');
    // Using confirm() breaks it so we use window.confirm()
    // See last comment https://helperbyte.com/questions/72323/how-to-work-with-a-confirm-to-react
    if (confirmDelete) {
      console.log('Deleting');
      const tempElements = JSON.parse(JSON.stringify(elements));
      tempElements.splice(i, 1);
      setElements(tempElements);
      setResetPreview(true);
      console.log('Deleted');
    } else {
      console.log('Not deleting');
    }
  };

  const handleEdit = i => {
    console.log('Handling edit...');
    const tempElements = JSON.parse(JSON.stringify(elements));
    const currentElement = tempElements[i];
    const newText = prompt('Edit', currentElement.text);
    if (newText) {
      console.log('Editing...');
      currentElement.text = newText;
      tempElements[i] = currentElement;
      setElements(tempElements);
      setResetPreview(true);
      console.log('Edited');
    } else {
      // either newText is empty or they hit cancel
      console.log('Not editing');
    }
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const result = arrayMove(elements, oldIndex, newIndex);
    handleReorder(result);
    setElements(result);
  };

  const getIndexPositionOfInsertPoint = () => {
    const insertPointElement = elements.find(el => {
      return el.type === 'insert';
    });
    const indexOfInsertPoint = elements.indexOf(insertPointElement);

    return indexOfInsertPoint;
  };

  // // TODO: save to server
  // // TODO: needs to handle when selection spans across multiple paragraphs
  const handleAddTranscriptSelectionToProgrammeScript = () => {
    console.log('Handling add transcript selection...');
    const result = getDataFromUserWordsSelection();
    if (result) {
      // result.words
      // TODO: if there's just one speaker in selection do following
      // if it's multiple split list of words into multiple groups
      // and add a papercut for each to the programme script
      const tempElements = elements;
      // TODO: insert at insert point

      const indexOfInsertPoint = getIndexPositionOfInsertPoint();
      let newElement;
      if (isOneParagraph(result.words)) {
        // create new element
        // TODO: Create new element could be refactored into helper function
        newElement = {
          id: cuid(),
          index: tempElements.length,
          type: 'paper-cut',
          start: result.start,
          end: result.end,
          speaker: result.speaker,
          words: result.words,
          transcriptId: result.transcriptId,
          labelId: []
        };
      } else {
        const paragraphs = divideWordsSelectionsIntoParagraphs(result.words);
        paragraphs.reverse().forEach(paragraph => {
          newElement = {
            id: cuid(),
            index: tempElements.length,
            type: 'paper-cut',
            start: paragraph[0].start,
            end: paragraph[paragraph.length - 1].end,
            speaker: paragraph[0].speaker,
            words: paragraph,
            transcriptId: paragraph[0].transcriptId,
            // TODO: ignoring labels for now
            labelId: []
          };
        });
      }
      // add element just above of insert point
      tempElements.splice(indexOfInsertPoint, 0, newElement);
      setElements(tempElements);
      // TODO: save to server
      setResetPreview(true);
    } else {
      console.log('nothing selected');
      alert('Select some text in the transcript to add to the programme script');
    }
  };

  const handleDoubleClickOnProgrammeScript = e => {
    console.log('Handling double click...');
    if (e.target.className === 'words') {
      const wordCurrentTime = e.target.dataset.start;
      // TODO: set current time in preview canvas
      // Video context probably needs more info like, which clip/track in the sequence?
      // investigate how to set currentTime in video context
      console.log('wordCurrentTime::', wordCurrentTime);
    }
  };

  const handleAddTranscriptElementToProgrammeScript = elementType => {
    console.log('Handling add transcript element...');
    // [old comment]: TODO: refactor - with helper functions
    const newElements = JSON.parse(JSON.stringify(elements));
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
      newElements.splice(indexOfInsertPoint, 0, newElement);
      // [old comment]: TODO: save to server (should this only be if the 'Save' button is clicked?)

      setElements(newElements);
      setResetPreview(true);
    }
  };

  return (
    <>
      <h2
        className={ [ 'text-truncate', 'text-muted' ].join(' ') }
        title={ `Programme Script Title: ${ title }` }
      >
        {title}
      </h2>
      <Card>
        <Card.Header ref={ previewCardRef }>
          {playlist ? (
            <PreviewCanvas width={ width } playlist={ playlist } />
          ) : null}
        </Card.Header>
        <Card.Header>
          <Row noGutters>
            <Col sm={ 12 } md={ 3 }>
              <Button
                // block
                variant="outline-secondary"
                onClick={ handleAddTranscriptSelectionToProgrammeScript }
                title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
              >
                <FontAwesomeIcon icon={ faPlus } /> Selection
              </Button>
            </Col>
            <Col sm={ 12 } md={ 2 }>
              <ElementsDropdown handleAdd={ handleAddTranscriptElementToProgrammeScript } />
            </Col>
            <Col sm={ 12 } md={ 3 }>
              <ExportDropdown
                transcripts={ transcripts }
                title={ title }
                elements={ elements }></ExportDropdown>
            </Col>
            <Col sm={ 12 } md={ 1 }>
              <Button
                variant="outline-secondary"
                onClick={ handleSaveProgrammeScript }
                // size="sm"
                title="save programme script"
                block
              >
                <FontAwesomeIcon icon={ faSave } />
                {/* Save */}
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <article
            style={ { height: '60vh', overflow: 'scroll' } }
            onDoubleClick={ handleDoubleClickOnProgrammeScript }
          >
            {elements ? (
              <SortableList useDragHandle onSortEnd={ onSortEnd }>
                { ProgrammeElements(elements, handleEdit, handleDelete) }
              </SortableList>
            ) : null}
          </article>
        </Card.Body>
      </Card>
    </>
  );
};

ProgrammeScript.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.any,
  transcripts: PropTypes.any
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(ProgrammeScript);
