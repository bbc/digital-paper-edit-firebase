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

  const createPaperEdits = async (paperEdit) => {

    try {
      await PaperEdits.putItem(papereditsId, paperEdit);
      console.log('Successfully saved');
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

      createPaperEdits(paperEdit);
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
      props.trackEvent({ category: 'paperEditor programmeScript', action: 'handleClearProgrammeScript' });
    }
  };

  //on load? if no elements, get paper edit from db and save state.elements
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

  //when elements are first loaded or change, set state.paperEdits to equal all the paper-cut items from elements
  useEffect(() => {
    console.log('useEffect elements', elements);
    console.log('useEffect paperEdits', paperEdits);
    if (elements) {
      const pe = elements.filter((element) => element.type === 'paper-cut');

      if (!paperEdits || (JSON.stringify(pe) !== JSON.stringify(paperEdits))) {
        setPaperEdits(pe);
      }
    }
  }, [ elements, paperEdits ]);

  //when paper edits are loaded/change, fetch or update the list of transcripts
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

  const handleGetMediaUrl = async(item) => {
    return await firebase.storage.storage.ref(item.ref).getDownloadURL();
  };

  //load/update playlist items(media urls and start/end times to play edited script) - triggered when resetPreview is true (change to paperedit)
  useEffect(() => {
    const getPlaylistItem = (element, ref, start) => ({
      type: 'video',
      sourceStart: element.start,
      duration: element.end - element.start,
      ref,
      start
    });

    const getMediaUrl = async (item) => {
      return await firebase.storage.storage.ref(item.ref).getDownloadURL();
    };

    const getPlaylist = async () => {
      const emptyPlaylist = { startTime: 0, playlist: [] };
      const results = paperEdits.reduce(
        (prevResult, paperEdit) => {
          const transcript = transcripts.find(t => t.id === paperEdit.transcriptId);
          if (transcript) {
            const playlistItem = getPlaylistItem(paperEdit, transcript.media.ref, prevResult.startTime);
            const updatedPlaylist = [ ...prevResult.playlist, playlistItem ];
            const updatedStartTime = prevResult.startTime + playlistItem.duration;

            return { ...prevResult, startTime: updatedStartTime, playlist: updatedPlaylist };
          }

          return prevResult;
        },
        emptyPlaylist
      );

      const playlistItems = await Promise.all(
        results.playlist.map(async (item) => {
          const src = await getMediaUrl(item);

          return { ...item, src };
        })
      );
      // console.log('playlistItems', playlistItems);
      setPlaylist(playlistItems);
      setResetPreview(false);
    };

    if (resetPreview && paperEdits && transcripts) {
      console.log('getting playlist');
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

  const formatSingleParagaph = ({ start, end, speaker, transcriptId, words }) => {
    console.log('Adding one paragraph...');
    const insertElementIndex = getInsertElementIndex();
    const playlistStartTime = getTranscriptSelectionStartTime(
      insertElementIndex
    );
    const paperCutDuration = end - start;
    const { sourceParagraphIndex } = words[0];

    // Recalcultates word timings to align with programme script playlist
    const wordsAdjusted = words.map((word, i) => {
      const wordStartTime = word.start - start + playlistStartTime;
      const wordDuration = word.end - word.start;
      const wordEndTime = wordStartTime + wordDuration;

      return { ...word,
        index: i,
        start: wordStartTime,
        end: wordEndTime,
        speaker,
      };
    });

    const newElement = {
      id: cuid(),
      index: insertElementIndex,
      type: 'paper-cut',
      start,
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
    const paperEditElements = paragraphSelections.reduce(
      (prevResult, paragraph) => {
        // Calculates start and end times in the programme script playlist
        const paperCutStart = prevResult.newDuration;
        const paperCutDuration = paragraph[paragraph.length - 1].end - paragraph[0].start;
        const paperCutEnd = paperCutStart + paperCutDuration;

        // Stores start and end times corresponding to the original media file and transcription
        const transcriptStart = parseFloat(paragraph[0].start);
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
          index: prevResult.index,
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

        return {
          elements: [ ...prevResult.elements, newPaperCut ],
          newDuration: prevResult.newDuration + paperCutDuration,
          index: prevResult.index + 1
        };
      }, emptyPaperEditElement
    );

    return paperEditElements;
  };

  const handleTransfer = () => {
    const selection = getDataFromUserWordsSelection();
    const elementsClone = JSON.parse(JSON.stringify(elements));
    const insertElementIndex = getInsertElementIndex();
    let updatedElements;

    if (selection) {
      if (isOneParagraph(selection.words)) {
        const newPaperCut = formatSingleParagaph(selection);
        elementsClone.splice(insertElementIndex, 0, newPaperCut);

        // Adjusts word timings for paper-cuts that come after the new element
        updatedElements = updateWordTimingsAfterInsert(
          elementsClone,
          insertElementIndex
        );
      } else {
        const newPaperCuts = formatMultipleParagraphs(selection, insertElementIndex);
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
                  handleGetMediaUrl = { handleGetMediaUrl }
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
