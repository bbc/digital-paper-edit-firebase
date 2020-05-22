/* eslint-disable no-undef */
import React, { useRef, useEffect, useState, Suspense } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import SearchBar from '../../SearchBar'; // move to same folder + rename to SearchTool
import Collection from '../../../../Firebase/Collection';
import TranscriptMenu from '../../TranscriptMenu';
import getTimeFromUserWordsSelection from '../../get-user-selection.js';
import paragraphWithAnnotations from '../../Paragraphs/add-annotations-to-words-in-paragraphs.js';
import groupWordsInParagraphsBySpeakers from '../../Paragraphs/group-words-by-speakers.js';
import removePunctuation from '../../../../../Util/remove-punctuation';
import { decompressAsync } from '../../../../../Util/gzip';

const Paragraphs = React.lazy(() => import('../../Paragraphs'));

const TranscriptTabContent = (props) => {
  const { transcriptId, projectId, title, firebase, media } = props;

  // media
  const videoRef = useRef();
  const [ url, setUrl ] = useState();
  const mediaType = media ? media.type : '';
  const mediaRef = media ? media.ref : '';

  const [ labels, setLabels ] = useState();
  const [ annotations, setAnnotations ] = useState();
  const [ speakers, setSpeakers ] = useState();

  // search terms
  const [ searchString, setSearchString ] = useState('');
  const [ selectedLabels, setSelectedLabels ] = useState([]);
  const [ selectedSpeakers, setSelectedSpeakers ] = useState([]);
  const [ hasSearch, setHasSearch ] = useState(false);

  // search display
  const [ paragraphOnly, setParagraphOnly ] = useState(true);
  const [ paragraphs, setParagraphs ] = useState();
  const [ displayParagraphs, setDisplayParagraphs ] = useState([]);
  const [ isSearchResults, setIsSearchResults ] = useState([]);

  const [ annotatedParagraphs, setAnnotatedParagraphs ] = useState();
  const [ processingParagraphs, setProcessingParagraphs ] = useState(false);

  // highlight
  const [ paragraphCSS, setParagraphsCSS ] = useState('');
  const [ searchHighlightCSS, setSearchHighlightCSS ] = useState('');
  const [ isHighlighting, setIsHighlighting ] = useState(false);

  const [ words, setWords ] = useState();

  const LabelsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/labels`
  );

  const AnnotationsCollection = new Collection(
    firebase,
    `projects/${ projectId }/transcripts/${ transcriptId }/annotations`
  );

  useEffect(() => {
    const getLabels = async () => {
      try {
        await LabelsCollection.collectionRef.onSnapshot((snapshot) => {
          const tempLabels = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          const lbls = tempLabels ? tempLabels : []; // to remove once a bug is fixed
          setLabels(lbls);
        });
      } catch (error) {
        console.error('Error getting labels: ', error);
      }
    };

    if (!labels) {
      getLabels();
    }

    return () => {};
  }, [ LabelsCollection.collectionRef, labels ]);

  useEffect(() => {
    const getDecompressedWordsParas = async (wordsc, paragraphsc) => {
      const wordsdc = await decompressAsync(wordsc);
      const paragraphsdc = await decompressAsync(paragraphsc);
      setWords(wordsdc);
      setParagraphs(paragraphsdc);
    };
    /* After migrating to compressed, we should remove the if/else,
              and rename wordsdc to words, paragraphsdc to paragraphs
              as we will not need it.
    */
    if (props.wordsc && props.paragraphsc) {
      getDecompressedWordsParas(props.wordsc, props.paragraphsc);
    } else {
      setWords(props.words);
      setParagraphs(props.paragraphs);
    }

    return () => {};
  }, [ props.paragraphs, props.words, props.wordsc, props.paragraphsc ]);

  useEffect(() => {
    const getAnnotations = async () => {
      try {
        AnnotationsCollection.collectionRef.onSnapshot((snapshot) => {
          const tempAnnotations = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });

          const anns = tempAnnotations ? tempAnnotations : []; // to remove once a bug is fixed
          setAnnotations(anns);
        });
      } catch (error) {
        console.error('Error getting annotations: ', error);
      }
    };
    if (!annotations) {
      getAnnotations();
    }

    return () => {};
  }, [ AnnotationsCollection.collectionRef, annotations ]);

  useEffect(() => {
    const getAnnotatedParagraphs = () => {
      setProcessingParagraphs(true);
      const groupedParagraphs = groupWordsInParagraphsBySpeakers(
        words,
        paragraphs
      );
      setAnnotatedParagraphs(
        paragraphWithAnnotations(groupedParagraphs, annotations)
      );
    };

    if (paragraphs && words && annotations && !processingParagraphs) {
      getAnnotatedParagraphs();
    }

    return () => {};
  }, [ annotations, paragraphs, words, processingParagraphs ]);

  useEffect(() => {
    const getUrl = async () => {
      const dlUrl = await firebase.storage.storage
        .ref(mediaRef)
        .getDownloadURL();
      setUrl(dlUrl);
    };

    if (!url) {
      getUrl();
    }
  }, [ projectId, transcriptId, firebase.storage, mediaRef, url ]);

  useEffect(() => {
    const highlightWords = (wordsToHighlight) => {
      const dataParagraphText = wordsToHighlight.join(' ');

      const css = wordsToHighlight.reduce(
        (res, word) => {
          res.paragraphs.push(
            `.paragraph[data-paragraph-text*="${ dataParagraphText }"] > div > span.words[data-text="${ word }"]`
          );
          // Need to add an extra span to search annotation highlights
          res.search.push(
            `.paragraph[data-paragraph-text*="${ dataParagraphText }"] > div > span > span.words[data-text="${ word }"]`
          );

          return res;
        },
        { paragraphs: [], search: [] }
      );

      css.paragraphs = css.paragraphs.join(', ');
      css.search.join(', ');

      return css;
    };

    if (searchString) {
      if (!isHighlighting) {
        setIsHighlighting(true);
        const wordsToHighlight = searchString
          .toLowerCase()
          .trim()
          .split(' ')
          .map((w) => w.trim());
        const css = highlightWords(wordsToHighlight);
        setParagraphsCSS(css.paragraphs);
        setSearchHighlightCSS(css.search);
        setIsHighlighting(false);
      } else {
        setParagraphsCSS('');
        setSearchString('');
      }
    }

    return () => {};
  }, [ isHighlighting, searchString ]);

  useEffect(() => {
    const getSpeakerLabels = () => {
      const speakerSet = annotatedParagraphs.reduce((uniqueSpeakers, p) => {
        uniqueSpeakers.add(p.speaker);

        return uniqueSpeakers;
      }, new Set());

      return Array.from(speakerSet).map((speaker) => ({
        value: speaker,
        label: speaker,
      }));
    };

    if (annotatedParagraphs) {
      setSpeakers(getSpeakerLabels(annotatedParagraphs));
    }

    return () => {};
  }, [ annotatedParagraphs ]);

  useEffect(() => {
    if (
      searchString !== '' ||
      selectedSpeakers.length > 0 ||
      selectedLabels.length > 0
    ) {
      setHasSearch(true);
    } else {
      setHasSearch(false);
    }

    return () => {
      setHasSearch(false);
    };
  }, [ searchString, selectedLabels, selectedSpeakers ]);

  useEffect(() => {
    /* Paragraph text for data attribute for searches, without punctuation */
    const findString = (str, text) => (str ? text.includes(str) : false);

    const findSpeaker = (speaker) =>
      !!selectedSpeakers.find((spk) => spk.label === speaker);

    const findLabel = (label) => !!selectedLabels.find((lb) => lb.id === label);

    const isSearchResult = (text, speaker, label) => {
      const textWithoutPunctuation = removePunctuation(text);
      const lcSearchString = searchString.toLowerCase();

      const foundSearchString = findString(
        lcSearchString,
        textWithoutPunctuation
      );

      const foundSpeaker = findSpeaker(speaker, selectedSpeakers);
      const foundLabel = findLabel(label, selectedLabels);

      if (foundSearchString || foundSpeaker || foundLabel) {
        return true;
      }

      return false;
    };

    const isParagraphSearchResult = (paragraph) => {
      const wordsAnnotation = paragraph.words.find((w) =>
        w.hasOwnProperty('annotation')
      );
      const labelId = wordsAnnotation ? wordsAnnotation.annotation.labelId : '';

      if (isSearchResult(paragraph.text, paragraph.speaker, labelId)) {
        return true;
      }

      return false;
    };

    const setAllDisplays = (display) => {
      const displayAllParagraphs = annotatedParagraphs.map((p) => display);
      setDisplayParagraphs(displayAllParagraphs);
    };

    const setAllSearchResults = (searchResult) => {
      const searchResults = annotatedParagraphs.map((p) => searchResult);
      setIsSearchResults(searchResults);
    };

    if (annotatedParagraphs) {
      if (paragraphOnly) {
        // don't style borders
        setAllSearchResults(false);
        if (hasSearch) {
          const foundParagraphs = annotatedParagraphs.map((p) =>
            isParagraphSearchResult(p)
          );
          setDisplayParagraphs(foundParagraphs);
        } else {
          setAllDisplays(true);
        }
      } else {
        // display all with styled borders for found paragraphs
        setAllDisplays(true);
        if (hasSearch) {
          const foundParagraphs = annotatedParagraphs.map((p) =>
            isParagraphSearchResult(p)
          );
          setIsSearchResults(foundParagraphs);
        } else {
          setAllSearchResults(false);
        }
      }
    }

    return () => {};
  }, [
    hasSearch,
    paragraphOnly,
    annotatedParagraphs,
    searchString,
    selectedLabels,
    selectedSpeakers,
  ]);

  const handleSearch = (e) => {
    if (e.target.type !== 'checkbox') {
      const text = e.target.value;
      if (text) {
        setSearchString(text);
      } else {
        setSearchString('');
      }
    }
  };

  const wordTimingEvent = (e) => {
    const wordEl = e.target;
    videoRef.current.currentTime = wordEl.dataset.start;
    videoRef.current.play();
  };

  const handleKeyDownTimecodes = (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('timecode')) {
      wordTimingEvent(e);
    }
  };

  const handleWordClick = (e) => {
    if (e.target.className === 'words') {
      wordTimingEvent(e);
    }
  };

  const handleTimecodeClick = (e) => {
    if (e.target.classList.contains('timecode')) {
      wordTimingEvent(e);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.className === 'words') {
      const wordEl = e.target;
      videoRef.current.currentTime = wordEl.dataset.start;
      videoRef.current.play();
    }
  };

  const createAnnotation = async (newAnnotation) => {
    const docRef = await AnnotationsCollection.postItem(newAnnotation);
    newAnnotation.id = docRef.id;
    docRef.update({
      id: docRef.id,
    });
  };

  const handleCreateAnnotation = (e) => {
    const selection = getTimeFromUserWordsSelection();
    if (selection) {
      const activeLabel = labels.find((label) => label.active);
      if (activeLabel) {
        selection.labelId = activeLabel.id;
      } else {
        selection.labelId = labels[0].id;
      }
      selection.note = '';
      const newAnnotation = selection;
      createAnnotation(newAnnotation);
      setAnnotations(() => [ ...annotations, newAnnotation ]);
      setProcessingParagraphs(false);
    } else {
      alert('Select some text in the transcript to highlight ');
    }
  };

  const handleDeleteAnnotation = (annotationId) => {
    const tempAnnotations = annotations;
    tempAnnotations.splice(annotationId, 1);
    setAnnotations(tempAnnotations);

    AnnotationsCollection.deleteItem(annotationId);
    setProcessingParagraphs(false);
  };

  const handleEditAnnotation = (annotationId) => {
    const newAnnotationToEdit = annotations.find((annotation) => {
      return annotation.id === annotationId;
    });

    const newNote = prompt(
      'Edit the text note of the annotation',
      newAnnotationToEdit.note
    );
    if (newNote) {
      newAnnotationToEdit.note = newNote;
      AnnotationsCollection.putItem(annotationId, newAnnotationToEdit);
      setAnnotations(() => [ ...annotations, newAnnotationToEdit ]);
      setProcessingParagraphs(false);
    } else {
      alert('all good nothing changed');
    }
  };

  const createLabel = async (newLabel) => {
    const docRef = await LabelsCollection.postItem(newLabel);
    newLabel.id = docRef.id;

    docRef.update({
      id: docRef.id,
    });
  };

  const onLabelCreate = (newLabel) => {
    createLabel(newLabel);
    const tempLabels = labels;
    tempLabels.push(newLabel);
    setLabels(tempLabels);
  };

  const onLabelUpdate = (labelId, updatedLabel) => {
    setLabels(() => [ ...tempLabels, updatedLabel ]);
    LabelsCollection.putItem(labelId, updatedLabel);
  };

  const onLabelDelete = (labelId) => {
    const tempLabels = labels;
    tempLabels.splice(labelId, 1);
    setLabels(tempLabels);
    LabelsCollection.deleteItem(labelId);
  };

  const updateLabelSelection = (e, labelId) => {
    const tempLabels = JSON.parse(JSON.stringify(labels));
    const previousActiveLabel = tempLabels.find((label) => label.active);
    if (previousActiveLabel) {
      previousActiveLabel.active = false;
    }
    const activeLabel = tempLabels.find((label) => label.id === labelId);
    activeLabel.active = true;
    setLabels(tempLabels);
  };

  const cardBodyHeight = mediaType.startsWith('audio') ? '100vh' : '60vh';

  let mediaElement;

  if (mediaType.startsWith('audio')) {
    mediaElement = (
      <audio
        src={ url }
        type={ mediaType }
        ref={ videoRef }
        style={ {
          width: '100%',
          backgroundColor: 'black',
        } }
        controls
      />
    );
  } else {
    mediaElement = (
      <video
        src={ url }
        type={ mediaType }
        ref={ videoRef }
        style={ {
          width: '100%',
          backgroundColor: 'black',
        } }
        controls
      />
    );
  }

  return (
    <>
      {paragraphCSS && searchHighlightCSS ? (
        <style scoped>
          {/* This is to style of the Paragraph component programmatically */}
          {`${ paragraphCSS } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
          {`${ searchHighlightCSS } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
        </style>
      ) : (
        <style scoped>
          {/* This is to style of the Paragraph component programmatically */}
          {`{ background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
          {`{ background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
        </style>
      )}

      <h2
        className={ [ 'text-truncate', 'text-muted' ].join(' ') }
        title={ `Transcript Title: ${ title }` }
      >
        {title}
      </h2>

      <Card>
        <Card.Header>{mediaElement}</Card.Header>
        <Card.Header>
          <TranscriptMenu
            labels={ labels }
            updateLabelSelection={ updateLabelSelection }
            handleCreateAnnotation={ handleCreateAnnotation }
            onLabelCreate={ onLabelCreate }
            onLabelUpdate={ onLabelUpdate }
            onLabelDelete={ onLabelDelete }
          />
        </Card.Header>
        <SearchBar
          handleSearch={ handleSearch }
          labels={ labels }
          speakers={ speakers }
          selectLabel={ setSelectedLabels }
          selectSpeaker={ setSelectedSpeakers }
          paragraphOnly={ paragraphOnly }
          selectedSpeakers={ selectedSpeakers }
          selectedLabels={ selectedLabels }
          toggleParagraphOnly={ () => setParagraphOnly(!paragraphOnly) }
        />

        <Card.Body
          onDoubleClick={ handleWordClick }
          onClick={ handleTimecodeClick }
          style={ { height: cardBodyHeight, overflow: 'scroll' } }
        >
          <Suspense fallback={ <div>Loading...</div> }>
            {annotatedParagraphs ? (
              <Paragraphs
                transcriptId={ transcriptId }
                paragraphs={ annotatedParagraphs }
                labels={ labels }
                isSearchResults={ isSearchResults }
                handleKeyPress={ handleKeyPress }
                displayParagraphs={ displayParagraphs }
                handleKeyDownTimecodes={ handleKeyDownTimecodes }
                handleDeleteAnnotation={ handleDeleteAnnotation }
                handleEditAnnotation={ handleEditAnnotation }
              />
            ) : null}
          </Suspense>
        </Card.Body>
      </Card>
    </>
  );
};

TranscriptTabContent.propTypes = {
  firebase: PropTypes.shape({
    storage: PropTypes.shape({
      storage: PropTypes.shape({
        ref: PropTypes.func,
      }),
    }),
  }),
  media: PropTypes.shape({
    ref: PropTypes.any,
    type: PropTypes.any,
  }),
  paragraphs: PropTypes.any,
  paragraphsc: PropTypes.any,
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcriptId: PropTypes.any,
  words: PropTypes.any,
  wordsc: PropTypes.any,
};

export default React.memo(TranscriptTabContent);
