import React, { useRef, useState, useEffect, Suspense } from 'react';
import cuid from 'cuid';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import arrayMove from 'array-move';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShare, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

import PreviewCanvas from '@bbc/digital-paper-edit-storybook/PreviewCanvas';

import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

import ExportDropdown from './ExportDropdown';
import ElementsDropdown from './ElementsDropdown';
import getDataFromUserWordsSelection from './get-data-from-user-selection';
import { isOneParagraph, divideWordsSelectionsIntoParagraphs } from './divide-words-selections-into-paragraphs';
import { compilePlaylist, getMediaUrl } from './utils/compilePlaylist';

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
  const projectTitle = props.projectTitle;
  const firebase = props.firebase;

  const [ elements, setElements ] = useState();
  const [ title, setTitle ] = useState('');
  const [ resetPreview, setResetPreview ] = useState(false);
  const [ currentTime, setCurrentTime ] = useState();
  const [ transcripts, setTranscripts ] = useState();
  const [ paperEdits, setPaperEdits ] = useState();

  const [ saved, setSaved ] = useState(true);

  // Video Context Preview
  const [ width, setWidth ] = useState(150);
  const [ playlist, setPlaylist ] = useState([]);
  const previewCardRef = useRef();
  const PaperEdits = new Collection(
    props.firebase,
    `/projects/${ projectId }/paperedits`
  );

  const createPaperEdits = async (paperEdit, newElements, insertPointElement) => {

    try {
      await PaperEdits.putItem(papereditsId, paperEdit);
      const insertedPaperCut = newElements.find(element => {

        return element.index === insertPointElement.index - 1;
      });
      console.log('Successfully saved');

      let insertedWords = '';
      insertedPaperCut.words.forEach(word => {
        insertedWords += word.text;
      });
      props.trackEvent({ category: 'programme script - programme script panel', action: 'insert selection', name: insertedWords });
      setResetPreview(true);
    } catch (error) {
      console.error('Error saving document', error);
    }
  };

  const handleSaveProgrammeScript = (els) => {
    if (els) {
      setSaved(false);
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

      createPaperEdits(paperEdit, newElements, insertPointElement);
      setSaved(true);
    };
  };

  const handleClearProgrammeScript = () => {
    const confirmDelete = window.confirm('Are you sure you want to delete?');
    if (confirmDelete) {
      const newList = [
        {
          type: 'insert',
          text: 'Insert point to add selection',
        }
      ];
      setElements(newList);
      setResetPreview(true);

      handleSaveProgrammeScript(newList);
      props.trackEvent({ category: 'programme script - programme script panel', action: 'clear', name: papereditsId });
    }
  };

  //on load, get paper edit from db and update elements
  useEffect(() => {
    const getPaperEdit = async () => {
      const PaperEditCollection = new Collection(
        firebase,
        `/projects/${ projectId }/paperedits`
      );

      try {
        const { title: paperEditTitle, elements: paperEditElements } = await PaperEditCollection.getItem(papereditsId);
        setTitle(paperEditTitle);

        const insertElement = {
          type: 'insert',
          text: 'Insert point to add selection',
        };

        const newElements = paperEditElements
          ? [ ...paperEditElements, insertElement ]
          : [ insertElement ];

        setElements(newElements);
        setResetPreview(true);
      } catch (error) {
        console.error('Error getting paper edits: ', error);
      }
    };

    if (!elements) {
      getPaperEdit();
    }
  }, [ elements, firebase, papereditsId, projectId ]);

  //when elements change, create paperEdits
  useEffect(() => {
    if (elements) {
      const pe = elements.filter((element) => element.type === 'paper-cut');

      if (!paperEdits || (JSON.stringify(pe) !== JSON.stringify(paperEdits))) {
        setPaperEdits(pe);
      }
    }
  }, [ elements, paperEdits ]);

  //when paperEdits are updated, update transcripts
  useEffect(() => {
    const collection = new Collection(
      props.firebase,
      `/projects/${ projectId }/transcripts`
    );
    const getTranscripts = async (trIds) => {
      try {
        if (!transcripts) {
          const trs = await Promise.all(trIds.map((async trId => {
            const transcript = await collection.getItem(trId);

            return { id: trId, ...transcript };
          })));
          setTranscripts(trs);
        } else {
          const trs = await Promise.all(trIds.map((async trId => {
            let transcript = (transcripts.find(t => t.id === trId));
            if (transcript) {
              return transcript;
            }

            transcript = await collection.getItem(trId);

            return { id: trId, ...transcript };
          })));
          setTranscripts(trs);
        }
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (paperEdits) {
      if (!transcripts ) {
        const trIds = Array.from(new Set(paperEdits.map(pe => pe.transcriptId)));
        getTranscripts(trIds);
      } else {
        const newTranscripts = paperEdits.filter(pe => !transcripts.find(tr => tr.id === pe.transcriptId ));
        if (newTranscripts.length > 0) {
          const trIds = Array.from(new Set(paperEdits.map(pe => pe.transcriptId)));
          getTranscripts(trIds);
        }
      }
    }

  }, [ paperEdits, projectId, props.firebase, transcripts ]);

  //when resetPreview is true and transcripts and paperEdits are set, update playlist
  useEffect(() => {
    async function getPlaylist() {
      const playlistItems = await compilePlaylist(paperEdits, transcripts, firebase.storage.storage);
      setPlaylist(playlistItems);
      setResetPreview(false);
    }

    if (resetPreview && paperEdits && transcripts) {
      getPlaylist();
    }

  }, [ firebase.storage.storage, transcripts, paperEdits, resetPreview ]);

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
    props.trackEvent({ category: 'programme script - programme script panel', action: 'delete', name: `${ elements[i].type }` });
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
    props.trackEvent({ category: 'programme script - programme script panel', action: 'edit', name: `${ currentElement.type }` });
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const newElements = arrayMove(elements, oldIndex, newIndex);
    console.log('handling reorder...');
    const updatedWords = updateWordTimings(newElements);
    setElements(updatedWords);
    setResetPreview(true);
    handleSaveProgrammeScript(updatedWords);
    props.trackEvent({ category: 'programme script - programme script panel', action: 'reorder', name: `${ elements[oldIndex].type } from: ${ oldIndex } to: ${ newIndex }` });
  };

  const getInsertElementIndex = () => {
    const insertElement = elements.find((el) => {
      return el.type === 'insert';
    });

    return elements.indexOf(insertElement);
  };

  // Calculates the duration of the programme script playlist up to the point of the new insertion
  const getTranscriptSelectionStartTime = (insertIndex) => {
    const prevElements = elements.slice(0, insertIndex);

    const pes = prevElements.filter(
      (element) => element.type === 'paper-cut'
    );

    const totalDuration = pes.reduce(
      (runningTotal, paperEdit) => {
        const paperEditDuration = paperEdit.end - paperEdit.start;

        return runningTotal + paperEditDuration;
      },
      0
    );

    return totalDuration;
  };

  const formatSingleParagraph = ({ start, end, speaker, transcriptId, words }) => {
    console.log('Adding one paragraph...');
    const insertElementIndex = getInsertElementIndex();
    const playlistStartTime = getTranscriptSelectionStartTime(
      insertElementIndex
    );
    const paperCutDuration = end - start;
    const { sourceParagraphIndex } = words[0];

    // Checking for the second to last element as the last is always 'Insert point to add selection.'
    const lastElement = elements[elements.length - 2];

    // Recalcultates word timings to align with programme script playlist
    const wordsAdjusted = words.map((word, i) => {
      const wordStartTime = word.start - start + playlistStartTime;
      const wordDuration = word.end - word.start;
      const wordEndTime = wordStartTime + wordDuration;

      return { ...word,
        index: i,
        start: wordStartTime,
        end: wordEndTime,
        speaker
      };
    });

    const isNotFirstElement = () => elements.length > 1;
    const areElementsConsecutive = () => lastElement.transcriptId === transcriptId && lastElement.sourceParagraphIndex + 1 === sourceParagraphIndex;
    const transcriptStart = isNotFirstElement() && areElementsConsecutive() ? lastElement.end : start;

    const newElement = {
      id: cuid(),
      index: insertElementIndex,
      type: 'paper-cut',
      start: transcriptStart,
      end,
      vcStart: playlistStartTime,
      vcEnd: playlistStartTime + paperCutDuration,
      words: wordsAdjusted,
      speaker,
      transcriptId,
      labelId: [],
      sourceParagraphIndex
    };

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

    const emptyPaperEditElement = {
      elements: [],
      newDuration: playlistStartTime,
      index: elements.length - 1,
    };

    const createPaperEditElements = (prevResults, paragraph) => {
      // Calculates start and end times in the programme script playlist
      const paperCutStart = prevResults.newDuration;
      const paperCutDuration = paragraph[paragraph.length - 1].end - paragraph[0].start;
      const paperCutEnd = paperCutStart + paperCutDuration;

      // Stores start and end times corresponding to the original media file and transcription
      const setNextElementStartTime = (existingElements) => existingElements[existingElements.length - 1].end;
      const transcriptStart = prevResults.elements.length > 0 ? setNextElementStartTime(prevResults.elements) : parseFloat(paragraph[0].start);
      const transcriptEnd = parseFloat(paragraph[paragraph.length - 1].end);

      const paperCutSpeaker = paragraph[0].speaker;
      const paperCutTranscriptId = paragraph[0].transcriptId;
      const sourceParagraphIndex = paragraph[0].sourceParagraphIndex;

      // Recalcultates word timings to align with programme script playlist
      const wordsAdjusted = paragraph.map((word, wordIndex) => {
        const newStart = word.start - transcriptStart + paperCutStart;
        const wordDuration = word.end - word.start;
        const newEnd = newStart + wordDuration;

        return {
          index: wordIndex,
          start: newStart,
          end: newEnd,
          speaker: paperCutSpeaker,
          text: word.text,
          transcriptId: paperCutTranscriptId,
        };
      });

      const newPaperCut = {
        id: cuid(),
        index: prevResults.index,
        type: 'paper-cut',
        start: transcriptStart,
        end: transcriptEnd,
        vcStart: paperCutStart,
        vcEnd: paperCutEnd,
        words: wordsAdjusted,
        speaker: paperCutSpeaker,
        transcriptId: paperCutTranscriptId,
        labelId: [],
        sourceParagraphIndex
      };

      const updatedElements = {
        elements: [ ...prevResults.elements, newPaperCut ],
        newDuration: prevResults.newDuration + paperCutDuration,
        index: prevResults.index + 1
      };

      return updatedElements;
    };

    const paperEditElements = paragraphSelections.reduce(createPaperEditElements, emptyPaperEditElement);

    return paperEditElements;
  };

  const handleTransfer = () => {
    const selection = getDataFromUserWordsSelection();
    const elementsClone = JSON.parse(JSON.stringify(elements));
    const insertElementIndex = getInsertElementIndex();
    let updatedElements;

    if (selection) {
      if (isOneParagraph(selection.words)) {
        const newPaperCut = formatSingleParagraph(selection);
        elementsClone.splice(insertElementIndex, 0, newPaperCut);

        // Adjusts word timings for paper-cuts that come after the new element
        updatedElements = updateWordTimingsAfterInsert(
          elementsClone,
          insertElementIndex
        );
      } else {
        const newPaperCuts = formatMultipleParagraphs(selection, insertElementIndex);
        elementsClone.splice(insertElementIndex, 0, ...newPaperCuts.elements);
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
        props.trackEvent({ category: 'programme script - programme script panel', action: 'add', name: elementType });
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
              handleClick={ (control) => props.trackEvent({ category: 'programme script - programme script panel', action: control, name: title }) }
            />
          ) : null}
        </Card.Header>
        <Card.Header>
          <Row noGutters>
            <Col>
              <Button
                variant="outline-secondary"
                onClick={ handleTransfer }
                title="Add a text selection, select text in the transcript, then click this button to add it to the programme script"
              >
                <FontAwesomeIcon icon={ faPlus } /> Selection
              </Button>
            </Col>
            <Col>
              <ElementsDropdown
                handleAdd={ handleAddElement }
              />
            </Col>
            <Col>
              {transcripts ?
                <ExportDropdown
                  projectTitle={ projectTitle }
                  transcripts={ transcripts }
                  title={ title }
                  elements={ elements }
                  storage={ firebase.storage.storage }
                  handleGetMediaUrl = { getMediaUrl }
                  trackEvent ={ props.trackEvent }
                />
                : (<Button variant="outline-secondary" disabled>
                  <FontAwesomeIcon icon={ faShare } /> Export
                </Button>)}
            </Col>

            <Col>{saved ? <Button disabled variant="outline-secondary"><FontAwesomeIcon icon={ faSave } /> Saved</Button> :
              (<Button variant="outline-secondary" onClick={ () => handleSaveProgrammeScript(elements) }><FontAwesomeIcon icon={ faSave } /> Save</Button>)}
            </Col>

            <Col>
              <Button variant="outline-secondary" onClick={ handleClearProgrammeScript }><FontAwesomeIcon icon={ faTimes } /> Clear</Button>
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
  projectTitle: PropTypes.any,
  trackEvent: PropTypes.func
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(ProgrammeScriptContainer);
