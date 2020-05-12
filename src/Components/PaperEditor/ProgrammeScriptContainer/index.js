import React, { useRef, useState, useEffect } from 'react';
import cuid from 'cuid';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import arrayMove from 'array-move';
import { SortableContainer } from 'react-sortable-hoc';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import PreviewCanvas from '@bbc/digital-paper-edit-storybook/PreviewCanvas';
import ProgrammeElements from '@bbc/digital-paper-edit-storybook/ProgrammeElements';

import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

import ExportDropdown from './ExportDropdown/index';
import ElementsDropdown from './ElementsDropdown/index';
import getDataFromUserWordsSelection from './get-data-from-user-selection';
import {
  divideWordsSelectionsIntoParagraphs,
  isOneParagraph,
} from './divide-words-selections-into-paragraphs';

import {
  updateWordTimings,
  updateWordTimingsAfterInsert,
  updateWordTimingsAfterDelete
} from './reset-word-timings';

import PropTypes from 'prop-types';

const ProgrammeScriptContainer = (props) => {
  const transcripts = props.transcripts;
  const papereditsId = props.match.params.papereditId;
  const projectId = props.match.params.projectId;
  const firebase = props.firebase;

  const [ elements, setElements ] = useState();
  const [ title, setTitle ] = useState('');
  const [ resetPreview, setResetPreview ] = useState(false);
  const [ currentTime, setCurrentTime ] = useState();

  const SortableList = SortableContainer(({ children }) => (
    <ul style={ { listStyle: 'none', padding: '0px' } }>{children}</ul>
  ));

  // Video Context Preview
  const [ width, setWidth ] = useState(150);
  const [ playlist, setPlaylist ] = useState([]);
  const previewCardRef = useRef();

  const PaperEditsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/paperedits`
  );

  const handleSaveProgrammeScript = async (els) => {
    if (els) {
      const newElements = JSON.parse(JSON.stringify(els));
      const insertPointElement = newElements.find((el) => el.type === 'insert');

      if (insertPointElement) {
        const insertElementIndex = newElements.indexOf(insertPointElement);
        newElements.splice(insertElementIndex, 1);
      }

      const paperEditDocument = {
        title: title,
        elements: newElements,
      };

      try {
        await PaperEditsCollection.putItem(papereditsId, paperEditDocument);
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

        const newElements = paperEdit.elements
          ? JSON.parse(JSON.stringify(paperEdit.elements))
          : [];
        const insertElement = {
          type: 'insert',
          text: 'Insert point to add selection',
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
    const getPlaylistItem = (element) => ({
      type: 'video',
      sourceStart: element.start,
      duration: element.end - element.start,
    });

    const getMediaUrl = async (item) => {
      return await firebase.storage.storage
        .ref(item.ref)
        .getDownloadURL();
    };

    const getPlaylist = async (els) => {
      const paperEdits = els.filter((element) => element.type === 'paper-cut');

      const results = paperEdits.reduce(
        (prevResult, paperEdit) => {
          const transcriptId = paperEdit.transcriptId;
          const transcript = transcripts.find((tr) => tr.id === transcriptId);
          const playlistItem = getPlaylistItem(paperEdit);
          playlistItem.ref = transcript.media.ref;
          playlistItem.start = prevResult.startTime;
          prevResult.playlist.push(playlistItem);
          prevResult.startTime += playlistItem.duration;

          return prevResult;
        },
        { startTime: 0, playlist: [] }
      );

      let { playlist: playlistItems } = results;
      playlistItems = await Promise.all(
        playlistItems.map(async (item) => {
          item.src = await getMediaUrl(item);

          return item;
        })
      );

      setPlaylist(playlistItems);
    };

    if (resetPreview && elements && elements.length > 0) {
      getPlaylist(elements);
      setResetPreview(false);
    }
  }, [ elements, resetPreview, firebase.storage.storage, transcripts ]);

  useEffect(() => {
    const updateVideoContextWidth = () => {
      setWidth(previewCardRef.current.offsetWidth - 10);
    };

    updateVideoContextWidth();

    window.addEventListener('resize', updateVideoContextWidth);

    return () => {
      window.removeEventListener('resize', updateVideoContextWidth);
    };
  });

  const handleDelete = async (i) => {
    console.log('Handling delete...');
    const confirmDelete = window.confirm('Are you sure you want to delete?');
    if (confirmDelete) {
      const reorderedList = JSON.parse(JSON.stringify(elements));
      const updatedWords = await updateWordTimingsAfterDelete(reorderedList, i);
      updatedWords.splice(i, 1);
      setElements(updatedWords);
      setResetPreview(true);
      handleSaveProgrammeScript(updatedWords);
      console.log('Deleted');
    } else {
      console.log('Not deleting');
    }
  };

  const handleEdit = (i) => {
    console.log('Handling edit...');
    const newElements = JSON.parse(JSON.stringify(elements));
    const currentElement = newElements[i];
    const newText = prompt('Edit', currentElement.text);
    if (newText) {
      currentElement.text = newText;
      newElements[i] = currentElement;
      setElements(newElements);
      setResetPreview(true);
      handleSaveProgrammeScript(newElements);
    } else {
    }
  };

  const onSortEnd = async ({ oldIndex, newIndex }) => {
    const newElements = arrayMove(elements, oldIndex, newIndex);
    console.log('handling reorder...');
    const updatedWords = await updateWordTimings(newElements);
    setElements(updatedWords);
    setResetPreview(true);
    handleSaveProgrammeScript(updatedWords);
  };

  const getInsertElementIndex = () => {
    const insertElement = elements.find((el) => {
      return el.type === 'insert';
    });

    return elements.indexOf(insertElement);
  };

  const getTranscriptSelectionStartTime = (insertIndex) => {
    const prevElements = elements.slice(0, insertIndex);

    const paperEdits = prevElements.filter((element) => element.type === 'paper-cut');

    const totalDuration = paperEdits.reduce((prevResult, paperEdit) => {
      const paperEditDuration = paperEdit.end - paperEdit.start;
      prevResult.startTime += paperEditDuration;

      return prevResult;
    },
    { startTime: 0 }
    );

    return totalDuration;
  };

  const addParagraphToProgrammeScript = (selection, insertElementIndex) => {
    console.log('Adding one paragraph...');
    const prevDuration = getTranscriptSelectionStartTime(insertElementIndex);

    const newElement = {
      id: cuid(),
      index: insertElementIndex,
      type: 'paper-cut',
      start: selection.start,
      end: selection.end,
      vcStart: prevDuration.startTime,
      vcEnd: prevDuration.startTime + (selection.end - selection.start),
      words: [],
      speaker: selection.speaker,
      transcriptId: selection.transcriptId,
      labelId: [],
    };

    const selectionWords = selection.words;

    // Recalcultates word timings to align with programme script playlist
    selectionWords.map((word, i) => {
      const newStart = (word.start - selection.start) + prevDuration.startTime;
      const wordDuration = (word.end - word.start);
      const newEnd = newStart + wordDuration;
      const newWord = {
        index: i,
        start: newStart,
        end: newEnd,
        speaker: selection.speaker,
        text: word.text,
        transcriptId: word.transcriptId
      };
      newElement.words.push(newWord);
    });

    return newElement;

  };

  const addParagraphsToProgrammeScript = (selection, insertElementIndex) => {
    console.log('Adding multiple paragraphs...');
    const prevDuration = getTranscriptSelectionStartTime(insertElementIndex);
    const paragraphSelections = divideWordsSelectionsIntoParagraphs(selection.words);

    const elsToAdd = paragraphSelections.reduce((prevResult, words) => {
      const elStart = prevResult.newDuration;
      const elEnd = elStart + (words[words.length - 1].end - words[0].start);
      const paperCutDuration = elEnd - elStart;

      const newElement = {
        id: cuid(),
        index: prevResult.index,
        type: 'paper-cut',
        start: parseFloat(words[0].start),
        end: parseFloat(words[words.length - 1].end),
        vcStart: elStart,
        vcEnd: elEnd,
        words: [],
        speaker: words[0].speaker,
        transcriptId: words[0].transcriptId,
        labelId: [],
      };

      // Recalcultates word timings to align with programme script playlist
      words.map((word, i) => {
        const newStart = (word.start - newElement.start) + prevResult.newDuration;
        const wordDuration = (word.end - word.start);
        const newEnd = newStart + wordDuration;
        const newWord = {
          index: i,
          start: newStart,
          end: newEnd,
          speaker: newElement.speaker,
          text: word.text,
          transcriptId: word.transcriptId
        };
        newElement.words.push(newWord);
      });

      prevResult.elements.push(newElement);
      prevResult.newDuration += paperCutDuration;
      prevResult.index += 1;

      return prevResult;
    }, { elements: [], newDuration: prevDuration.startTime, index: elements.length - 1 });

    return elsToAdd;

  };

  const handleAddTranscriptSelectionToProgrammeScript = async () => {
    console.log('Handling add transcript selection...');
    const selection = getDataFromUserWordsSelection();
    const elementsClone = JSON.parse(JSON.stringify(elements));
    const insertElementIndex = getInsertElementIndex();
    let updatedElements;

    if (selection) {
      if (isOneParagraph(selection.words)) {
        const newElement = addParagraphToProgrammeScript(selection, elementsClone, insertElementIndex);
        elementsClone.splice(insertElementIndex, 0, newElement);

        // Adjusts word timings for paper-cuts that come after the new element
        updatedElements = updateWordTimingsAfterInsert(elementsClone, insertElementIndex);

      } else {
        const elsToAdd = addParagraphsToProgrammeScript(selection, insertElementIndex);
        elementsClone.splice(insertElementIndex, 0, ...elsToAdd.elements);

        // Adjusts word timings for paper-cuts effected by the insert
        updatedElements = await updateWordTimings(elementsClone);
      }
      setElements(updatedElements);
      setResetPreview(true);
      handleSaveProgrammeScript(updatedElements);
    } else {
      console.log('nothing selected');
      alert(
        'Select some text in the transcript to add to the programme script'
      );
    }
  };

  const handleDoubleClickOnProgrammeScript = (e) => {
    console.log('Handling double click...');
    if (e.target.className === 'words') {
      const wordCurrentTime = e.target.dataset.start;
      setCurrentTime(wordCurrentTime);
    }
  };

  const handleAddTranscriptElementToProgrammeScript = (elementType) => {
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

      if (text !== null) {
        console.log('Adding element');
        const insertElementIndex = getInsertElementIndex();
        const newElement = {
          id: cuid(),
          index: elements.length,
          type: elementType,
          text: text,
        };
        newElements.splice(insertElementIndex, 0, newElement);
        setElements(newElements);
        console.log('Added element');
        setResetPreview(true);
        handleSaveProgrammeScript(newElements);
      } else {
        console.log('Not adding element');
      }
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
            <PreviewCanvas width={ width } playlist={ playlist } currentTime={ currentTime }/>
          ) : null}
        </Card.Header>
        <Card.Header>
          <Row noGutters>
            <Col sm={ 12 } md={ 3 }>
              <Button
                variant="outline-secondary"
                onClick={ handleAddTranscriptSelectionToProgrammeScript }
                title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
              >
                <FontAwesomeIcon icon={ faPlus } /> Selection
              </Button>
            </Col>
            <Col sm={ 12 } md={ 2 }>
              <ElementsDropdown
                handleAdd={ handleAddTranscriptElementToProgrammeScript }
              />
            </Col>
            <Col sm={ 12 } md={ 3 }>
              <ExportDropdown
                transcripts={ transcripts }
                title={ title }
                elements={ elements }
              ></ExportDropdown>
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
                {ProgrammeElements(elements, handleEdit, handleDelete)}
              </SortableList>
            ) : null}
          </article>
        </Card.Body>
      </Card>
    </>
  );
};

ProgrammeScriptContainer.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.any,
  transcripts: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(ProgrammeScriptContainer);
