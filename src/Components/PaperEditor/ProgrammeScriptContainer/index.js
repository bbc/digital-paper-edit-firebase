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
  const firebase = props.firebase;

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
    firebase,
    `/projects/${ projectId }/paperedits`
  );

  const handleSaveProgrammeScript = async () => {
    console.log('Saving...');
    if (elements) {
      const newElements = JSON.parse(JSON.stringify(elements));
      const insertPointElement = newElements.find(el => {
        return el.type === 'insert';
      });
      if (insertPointElement) {
        const insertElementIndex = newElements.indexOf(insertPointElement);
        newElements.splice(insertElementIndex, 1);
      }

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
        const newElements = paperEdit.elements ?
          JSON.parse(JSON.stringify(paperEdit.elements)) :
          [];
        const insertElement = {
          type: 'insert',
          text: 'Insert point to add selection'
        };

        newElements.push(insertElement);
        setElements(newElements);
        setResetPreview(true);

      } catch (error) {
        console.error('Error getting paper edits: ', error);
      }
    };

    if (!elements) {
      getPaperEdit();
    }
  }, [ PaperEditsCollection, elements, papereditsId ]);

  useEffect(() => {
    const getTranscript = transcriptId => {
      return transcripts.find(tr => tr.id === transcriptId);
    };

    const getPlaylist = () => {
      let startTime = 0;

      return elements
        .filter(element => element.type === 'paper-cut')
        .map(element => {
          const transcript = getTranscript(element.transcriptId);
          const playlistItem = {
            type: 'video',
            start: startTime,
            sourceStart: element.start,
            duration: element.end - element.start,
            src: transcript.url
          };

          startTime += playlistItem.duration;

          return playlistItem;
        });
    };

    const handleUpdatePreview = () => {
      // const currentPlaylist = getPlaylist();

      // [old comment]: Workaround to mound and unmount the `PreviewCanvas` component
      // to update the playlist

      // currentPlaylist is hard-coded data to test previewCanvas functionality. This needs
      // to be refactored to be dyanmically retrieved with the currentPlaylist function.
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

    if (resetPreview) {
      handleUpdatePreview();
      setResetPreview(false);
    }

  }, [ elements, resetPreview, transcripts ]);

  useEffect(() => {

    const updateVideoContextWidth = () => {
      setWidth(previewCardRef.current.offsetWidth - 10);
    };

    window.addEventListener('resize', updateVideoContextWidth);

    return () => {
      window.removeEventListener('resize', updateVideoContextWidth);
    };
  });

  const handleReorder = (newElements) => {
    console.log('Handling reorder...');
    setElements(newElements);
    setResetPreview(true);
    console.log('Reordered');
  };

  const handleDelete = i => {
    console.log('Handling delete...');
    const confirmDelete = window.confirm('Are you sure you want to delete?');
    // Using confirm() breaks it so we use window.confirm()
    // See last comment https://helperbyte.com/questions/72323/how-to-work-with-a-confirm-to-react
    if (confirmDelete) {
      console.log('Deleting');
      const newElements = JSON.parse(JSON.stringify(elements));
      newElements.splice(i, 1);
      setElements(newElements);
      setResetPreview(true);
      console.log('Deleted');
    } else {
      console.log('Not deleting');
    }
  };

  const handleEdit = i => {
    console.log('Handling edit...');
    const newElements = JSON.parse(JSON.stringify(elements));
    const currentElement = newElements[i];
    const newText = prompt('Edit', currentElement.text);
    if (newText) {
      console.log('Editing...');
      currentElement.text = newText;
      newElements[i] = currentElement;
      setElements(newElements);
      setResetPreview(true);
      console.log('Edited');
    } else {
      // either newText is empty or they hit cancel
      console.log('Not editing');
    }
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const newElements = arrayMove(elements, oldIndex, newIndex);
    handleReorder(newElements);
    setElements(newElements);
  };

  const getInsertElementIndex = () => {
    const insertElement = elements.find(el => {
      return el.type === 'insert';
    });

    return elements.indexOf(insertElement);
  };

  // // [old comment] TODO: needs to handle when selection spans across multiple paragraphs
  const handleAddTranscriptSelectionToProgrammeScript = () => {
    console.log('Handling add transcript selection...');
    const result = getDataFromUserWordsSelection();
    if (result) {
      // result.words
      // TODO: if there's just one speaker in selection do following
      // if it's multiple split list of words into multiple groups
      // and add a papercut for each to the programme script
      const newElements = JSON.parse(JSON.stringify(elements));
      // TODO: insert at insert point

      const insertElementIndex = getInsertElementIndex();
      let newElement;
      if (isOneParagraph(result.words)) {
        // create new element
        // TODO: Create new element could be refactored into helper function
        newElement = {
          id: cuid(),
          index: newElements.length,
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
            index: newElements.length,
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
      newElements.splice(insertElementIndex, 0, newElement);
      setElements(newElements);
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

      const insertElementIndex = getInsertElementIndex();
      const newElement = {
        id: cuid(),
        index: elements.length,
        type: elementType,
        text: text
      };
      newElements.splice(insertElementIndex, 0, newElement);
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
            <PreviewCanvas width={ width } playlist={ playlist }/>
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
  transcripts: PropTypes.any,
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(ProgrammeScript);
