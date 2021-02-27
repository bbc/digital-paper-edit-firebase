import React, { useRef, useState, useEffect, Suspense } from 'react';
import cuid from 'cuid';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import arrayMove from 'array-move';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShare } from '@fortawesome/free-solid-svg-icons';

import PreviewCanvas from '@bbc/digital-paper-edit-storybook/PreviewCanvas';

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
  updateWordTimingsAfterDelete,
} from './reset-word-timings';

import PropTypes from 'prop-types';

const Article = React.lazy(() => import('./Article'));

const ProgrammeScriptContainer = (props) => {
  const papereditsId = props.match.params.papereditId;
  const projectId = props.match.params.projectId;
  const firebase = props.firebase;

  const [ elements, setElements ] = useState();
  const [ title, setTitle ] = useState('');
  const [ resetPreview, setResetPreview ] = useState(false);
  const [ currentTime, setCurrentTime ] = useState();
  const [ transcripts, setTranscripts ] = useState();

  const [ fetchTranscripts, setFetchTranscripts ] = useState(false);

  // Video Context Preview
  const [ width, setWidth ] = useState(150);
  const [ playlist, setPlaylist ] = useState([]);
  const previewCardRef = useRef();

  const PaperEdits = new Collection(
    firebase,
    `/projects/${ projectId }/paperedits`
  );

  const Transcriptions = new Collection(
    props.firebase,
    `/projects/${ projectId }/transcripts`
  );

  const createPaperEdits = async (paperEdit) => {
    try {
      await PaperEdits.putItem(papereditsId, paperEdit);
      console.log('Successfully saved');
    } catch (error) {
      console.error('Error saving document', error);
    }
  };

  const handleSaveProgrammeScript = (els) => {
    if (els) {
      const newElements = JSON.parse(JSON.stringify(els));
      const insertPointElement = newElements.find((el) => el.type === 'insert');

      if (insertPointElement) {
        const insertElementIndex = newElements.indexOf(insertPointElement);
        newElements.splice(insertElementIndex, 1);
      }

      const paperEdit = {
        title: title,
        elements: newElements,
      };

      createPaperEdits(paperEdit);
    }
  };

  useEffect(() => {
    const getPaperEdit = async () => {
      try {
        const paperEdit = await PaperEdits.getItem(papereditsId);
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
  }, [ PaperEdits, elements, papereditsId ]);

  useEffect(() => {
    const getTranscripts = async () => {
      setFetchTranscripts(true);
      try {
        const paperEdits = elements.filter((element) => element.type === 'paper-cut');
        const trs = await Promise.all(paperEdits.map((async paperEdit => {
          const tr = await Transcriptions.getItem(paperEdit.transcriptId);

          return { id: paperEdit.transcriptId, ...tr };
        })));
        console.log(trs);
        setTranscripts(trs);
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (resetPreview && elements && elements.length > 0 && !transcripts && !fetchTranscripts) {
      getTranscripts();
    }

    return () => {};
  }, [ Transcriptions, transcripts, elements, fetchTranscripts, resetPreview ]);

  useEffect(() => {
    const getPlaylistItem = (element) => ({
      type: 'video',
      sourceStart: element.start,
      duration: element.end - element.start,
    });

    const getMediaUrl = async (item) => {
      return await firebase.storage.storage.ref(item.ref).getDownloadURL();
    };

    const getPlaylist = async () => {
      const paperEdits = elements.filter((element) => element.type === 'paper-cut');

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

    if (resetPreview && elements && elements.length > 0 && transcripts) {
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

  const handleDelete = (i) => {
    console.log('Handling delete...');
    const confirmDelete = window.confirm('Are you sure you want to delete?');
    if (confirmDelete) {
      const reorderedList = JSON.parse(JSON.stringify(elements));
      const updatedWords = updateWordTimingsAfterDelete(reorderedList, i);
      updatedWords.splice(i, 1);
      setElements(updatedWords);
      setResetPreview(true);
      handleSaveProgrammeScript(updatedWords);
    }
    props.trackEvent({ category: 'paperEditor programmeScript', action: `handleDelete ${ i }` });
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
    }
    props.trackEvent({ category: 'paperEditor programmeScript', action: `handleEdit ${ newText }` });
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const newElements = arrayMove(elements, oldIndex, newIndex);
    console.log('handling reorder...');
    const updatedWords = updateWordTimings(newElements);
    setElements(updatedWords);
    setResetPreview(true);
    handleSaveProgrammeScript(updatedWords);
    props.trackEvent({ category: 'paperEditor programmeScript', action: `onSortEnd from:${ oldIndex } to:${ newIndex }` });
  };

  const getInsertElementIndex = () => {
    const insertElement = elements.find((el) => {
      return el.type === 'insert';
    });

    return elements.indexOf(insertElement);
  };

  // Calcultates the duration of the programme script playlist up to the point of the new insertion
  const getTranscriptSelectionStartTime = (insertIndex) => {
    const prevElements = elements.slice(0, insertIndex);

    const paperEdits = prevElements.filter(
      (element) => element.type === 'paper-cut'
    );

    const totalDuration = paperEdits.reduce(
      (prevResult, paperEdit) => {
        const paperEditDuration = paperEdit.end - paperEdit.start;
        prevResult.startTime += paperEditDuration;

        return prevResult;
      },
      { startTime: 0 }
    );

    return totalDuration;
  };

  const formatSingleParagaph = (selection) => {
    console.log('Adding one paragraph...');
    const insertElementIndex = getInsertElementIndex();
    const playlistStartTime = getTranscriptSelectionStartTime(
      insertElementIndex
    );
    const paperCutDuration = selection.end - selection.start;

    const newElement = {
      id: cuid(),
      index: insertElementIndex,
      type: 'paper-cut',
      start: selection.start,
      end: selection.end,
      vcStart: playlistStartTime.startTime,
      vcEnd: playlistStartTime.startTime + paperCutDuration,
      words: [],
      speaker: selection.speaker,
      transcriptId: selection.transcriptId,
      labelId: [],
    };

    const selectedWords = selection.words;

    // Recalcultates word timings to align with programme script playlist
    selectedWords.map((word, i) => {
      const wordStartTime =
        word.start - selection.start + playlistStartTime.startTime;
      const wordDuration = word.end - word.start;
      const wordEndTime = wordStartTime + wordDuration;
      const newWord = {
        index: i,
        start: wordStartTime,
        end: wordEndTime,
        speaker: selection.speaker,
        text: word.text,
        transcriptId: word.transcriptId,
      };
      newElement.words.push(newWord);
    });

    return newElement;
  };

  const formatMultipleParagraphs = (selection, insertElementIndex) => {
    console.log('Adding multiple paragraphs...');
    const playlistStartTime = getTranscriptSelectionStartTime(
      insertElementIndex
    );
    const paragraphSelections = divideWordsSelectionsIntoParagraphs(
      selection.words
    );

    const paperEditElements = paragraphSelections.reduce(
      (prevResult, paragraph) => {
        // Calculates start and end times in the programme script playlist
        const paperCutStart = prevResult.newDuration;
        const paperCutDuration =
          paragraph[paragraph.length - 1].end - paragraph[0].start;
        const paperCutEnd = paperCutStart + paperCutDuration;

        // Stores start and end times corresponding to the original media file and transcription
        const transcriptStart = parseFloat(paragraph[0].start);
        const transcriptEnd = parseFloat(paragraph[paragraph.length - 1].end);

        const paperCutSpeaker = paragraph[0].speaker;
        const paperCutTranscriptId = paragraph[0].transcriptId;

        const newPaperCut = {
          id: cuid(),
          index: prevResult.index,
          type: 'paper-cut',
          start: transcriptStart,
          end: transcriptEnd,
          vcStart: paperCutStart,
          vcEnd: paperCutEnd,
          words: [],
          speaker: paperCutSpeaker,
          transcriptId: paperCutTranscriptId,
          labelId: [],
        };

        // Recalcultates word timings to align with programme script playlist
        paragraph.map((word, index) => {
          const newStart = word.start - transcriptStart + paperCutStart;
          const wordDuration = word.end - word.start;
          const newEnd = newStart + wordDuration;
          const newWord = {
            index: index,
            start: newStart,
            end: newEnd,
            speaker: paperCutSpeaker,
            text: word.text,
            transcriptId: paperCutTranscriptId,
          };
          newPaperCut.words.push(newWord);
        });

        prevResult.elements.push(newPaperCut);
        prevResult.newDuration += paperCutDuration;
        prevResult.index += 1;

        return prevResult;
      },
      {
        elements: [],
        newDuration: playlistStartTime.startTime,
        index: elements.length - 1,
      }
    );

    return paperEditElements;
  };

  const handleTransfer = () => {
    console.log('Handling add transcript selection...');
    const selection = getDataFromUserWordsSelection();
    const elementsClone = JSON.parse(JSON.stringify(elements));
    const insertElementIndex = getInsertElementIndex();
    let updatedElements;

    if (selection) {
      if (isOneParagraph(selection.words)) {
        const newPaperCut = formatSingleParagaph(
          selection,
          elementsClone,
          insertElementIndex
        );
        elementsClone.splice(insertElementIndex, 0, newPaperCut);

        // Adjusts word timings for paper-cuts that come after the new element
        updatedElements = updateWordTimingsAfterInsert(
          elementsClone,
          insertElementIndex
        );
      } else {
        const newPaperCuts = formatMultipleParagraphs(
          selection,
          insertElementIndex
        );
        elementsClone.splice(insertElementIndex, 0, ...newPaperCuts.elements);

        // Adjusts word timings for paper-cuts effected by the insert
        updatedElements = updateWordTimings(elementsClone);
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

  const handleDblClick = (e) => {
    console.log('Handling double click...');
    if (e.target.className === 'words') {
      const wordCurrentTime = e.target.dataset.start;
      setCurrentTime(wordCurrentTime);
    }
    props.trackEvent({ category: 'paperEditor programmeScript', action: 'handleDblClick' });
  };

  const handleAddElement = (elementType) => {
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
            <PreviewCanvas
              width={ width }
              playlist={ playlist }
              currentTime={ currentTime }
            />
          ) : null}
        </Card.Header>
        <Card.Header>
          <Row noGutters>
            <Col sm={ 12 } md={ 3 }>
              <Button
                variant="outline-secondary"
                onClick={ handleTransfer }
                title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
              >
                <FontAwesomeIcon icon={ faPlus } /> Selection
              </Button>
            </Col>
            <Col sm={ 12 } md={ 2 }>
              <ElementsDropdown
                handleAdd={ handleAddElement }
              />
            </Col>
            <Col sm={ 12 } md={ 3 }>
              {transcripts ?
                <ExportDropdown
                  transcripts={ transcripts }
                  title={ title }
                  elements={ elements }
                />
                : (<Button variant="outline-secondary" disabled>
                  <FontAwesomeIcon icon={ faShare } /> Export
                </Button>)}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {elements ? (
            <Suspense fallback={ <div>Loading...</div> }>
              <Article
                elements={ elements }
                handleDblClick={ handleDblClick }
                onSortEnd={ onSortEnd }
                handleEdit={ handleEdit }
                handleDelete={ handleDelete }
              />
            </Suspense>
          ) : null}
        </Card.Body>
      </Card>
    </>
  );
};

ProgrammeScriptContainer.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(ProgrammeScriptContainer);
