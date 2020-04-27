/* eslint-disable no-undef */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Paragraphs from '../Paragraphs';
import onlyCallOnce from '../../../../Util/only-call-once/index.js';
import SearchBar from '../SearchBar';
import Collection from '../../../Firebase/Collection';
import TranscriptMenu from './TranscriptMenu';
import getTimeFromUserWordsSelection from '../get-user-selection.js';

const getSpeakerLabels = (paragraphs) => {
  const speakerSet = paragraphs.reduce((uniqueSpeakers, p) => {
    uniqueSpeakers.add(p.speaker);

    return uniqueSpeakers;
  }, new Set());

  return Array.from(speakerSet).map((speaker) => ({
    value: speaker,
    label: speaker,
  }));
};

const TranscriptTabContent = (props) => {
  const videoRef = useRef();

  const { transcriptId, projectId, title, firebase, media, transcript } = props;
  const mediaType = media ? media.type : '';
  const [ url, setUrl ] = useState();
  const [ labels, setLabels ] = useState();
  const [ annotations, setAnnotations ] = useState();
  const [ searchString, setSearchString ] = useState('');
  const [
    showParagraphsMatchingSearch,
    setShowParagraphsMatchingSearch,
  ] = useState(false);
  const [ selectedOptionLabelSearch, setSelectedOptionLabelSearch ] = useState(
    []
  );
  const [
    selectedOptionSpeakerSearch,
    setSelectedOptionSpeakerSearch,
  ] = useState([]);
  const [ sentenceToSearchCSS, setSentenceToSearchCSS ] = useState('');
  const [
    sentenceToSearchCSSInHighlights,
    setSentenceToSearchCSSInHighlights,
  ] = useState('');
  const [ currentTime, setCurrentTime ] = useState();

  const LabelsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/labels`
  );

  const AnnotationsCollection = new Collection(
    firebase,
    `projects/${ projectId }/annotations`
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
    const getUrl = async () => {
      const dlUrl = await firebase.storage.storage
        .ref(media.ref)
        .getDownloadURL();
      setUrl(dlUrl);
    };

    if (!url) {
      getUrl();
    }
  }, [ projectId, transcriptId, firebase.storage, media.ref, url ]);

  const showLabelsReference = () => {};

  const handleLabelsSearchChange = (selectedOptionLabelSearch) => {};

  const handleSearch = (e) => {
    // TODO: debounce to optimise
    if (e.target.value !== '') {
      const text = e.target.value;
      setSearchString(text.toLowerCase());
      //  "debounce" to optimise
      onlyCallOnce(highlightWords(searchString), 500);
    }
    // if empty string reset
    else if (e.target.value === '') {
      setSentenceToSearchCSS('');
      setSearchString('');
    }
  };

  const highlightWords = (text) => {
    const words = text.toLowerCase().trim().split(' ');
    const cssName = words.join(' ');
    const paragraphCSS = `.paragraph[data-paragraph-text*="${ cssName }"]`;

    const css = words.reduce(
      (res, word) => {
        res.paragraphs.push(
          `${ paragraphCSS } > div > span.words[data-text="${ word }"]`
        );
        res.search.push(
          `${ paragraphCSS } > div > span >span.words[data-text="${ word }"]`
        );

        return res;
      },
      { paragraphs: [], search: [] }
    );
    const wordsToSearchCSS = css.paragraphs.join(', ');
    // Need to add an extra span to search annotation hilights
    // TODO: refactor to make more DRY
    const wordsToSearchCSSInHighlights = css.search.join(', ');
    setSentenceToSearchCSS(wordsToSearchCSS);
    setSentenceToSearchCSSInHighlights(wordsToSearchCSSInHighlights);
  };

  const handleTimecodeClick = (e) => {
    if (e.target.classList.contains('timecode')) {
      const wordEl = e.target;
      videoRef.current.currentTime = wordEl.dataset.start;
      videoRef.current.play();
    }
  };

  const handleWordClick = (e) => {
    if (e.target.className === 'words') {
      const wordEl = e.target;
      videoRef.current.currentTime = wordEl.dataset.start;
      videoRef.current.play();
    }
  };

  const handleCreateAnnotation = async (e) => {
    const selection = getTimeFromUserWordsSelection();
    if (selection) {
      const activeLabel = labels.find((label) => {
        return label.active;
      });
      if (activeLabel) {
        selection.labelId = activeLabel.id;
      } else {
        selection.labelId = labels[0].id;
      }
      selection.note = '';
      const newAnnotation = selection;

      const docRef = await AnnotationsCollection.postItem(newAnnotation);
      newAnnotation.id = docRef.id;

      docRef.update({
        id: docRef.id,
      });

      const tempAnnotations = annotations;
      tempAnnotations.push(newAnnotation);
      setAnnotations(tempAnnotations);
    } else {
      alert('Select some text in the transcript to highlight ');
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    const tempAnnotations = annotations;
    tempAnnotations.splice(annotationId, 1);
    setAnnotations(tempAnnotations);
    await AnnotationsCollection.deleteItem(annotationId);
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
      const tempAnnotations = annotations;
      tempAnnotations.push(newAnnotationToEdit);
      setAnnotations(tempAnnotations);
    } else {
      alert('all good nothing changed');
    }
  };

  const onLabelCreate = async (newLabel) => {
    const docRef = await LabelsCollection.postItem(newLabel);
    newLabel.id = docRef.id;

    docRef.update({
      id: docRef.id,
    });

    const tempLabels = labels;
    tempLabels.push(newLabel);
    setLabels(tempLabels);
  };

  const onLabelUpdate = async (labelId, updatedLabel) => {
    const tempLabels = labels;
    tempLabels.push(updatedLabel);
    setLabels(tempLabels);
    LabelsCollection.putItem(labelId, updatedLabel);
  };

  const onLabelDelete = async (labelId) => {
    const tempLabels = labels;
    tempLabels.splice(labelId, 1);
    setLabels(tempLabels);
    await LabelsCollection.deleteItem(labelId);
  };

  const updateSelectedLabel = (e, labelId) => {
    const tempLabels = JSON.parse(JSON.stringify(labels));
    const previousActiveLabel = tempLabels.find((label) => label.active);
    if (previousActiveLabel) {
      previousActiveLabel.active = false;
    }
    const activeLabel = tempLabels.find((label) => label.id === labelId);
    activeLabel.active = true;
    setLabels(tempLabels);
  };

  const currentWordTime = currentTime;
  const unplayedColor = 'grey';

  // Time to the nearest half second
  const time = Math.round(currentWordTime * 4.0) / 4.0;
  const highlights = (
    <style scoped>
      {`span.words[data-prev-times~="${ Math.floor(
        time
      ) }"][data-transcript-id="${
        TranscriptTabContent.transcriptId
      }"] { color: ${ unplayedColor } }`}
    </style>
  );

  const cardBodyHeight = mediaType.startsWith('audio') ? '100vh' : '60vh';

  let transcriptMediaCard;

  if (mediaType.startsWith('audio')) {
    transcriptMediaCard = (
      <Card.Header>
        <audio
          src={ url }
          type={ mediaType }
          ref={ videoRef }
          onTimeUpdate={ (e) => setCurrentTime(e.target.currentTime) }
          style={ {
            width: '100%',
            backgroundColor: 'black',
          } }
          controls
        />
      </Card.Header>
    );
  } else {
    transcriptMediaCard = (
      <Card.Header>
        <video
          src={ url }
          type={ mediaType }
          ref={ videoRef }
          onTimeUpdate={ (e) => setCurrentTime(e.target.currentTime) }
          style={ {
            width: '100%',
            backgroundColor: 'black',
          } }
          controls
        />
      </Card.Header>
    );
  }

  let speakersOptions = null;
  if (transcript && transcript.paragraphs) {
    speakersOptions = getSpeakerLabels(transcript.paragraphs);
  }

  return (
    <>
      <style scoped>
        {/* This is to style of the Paragraph component programmatically */}
        {`${ sentenceToSearchCSS } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
        {`${ sentenceToSearchCSSInHighlights } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
      </style>

      <h2
        className={ [ 'text-truncate', 'text-muted' ].join(' ') }
        title={ `Transcript Title: ${ title }` }
      >
        {/* <FontAwesomeIcon icon={ this.state.isVideoTranscriptPreviewShow === 'none' ? faEye : faEyeSlash } onClick={ this.handleVideoTranscriptPreviewDisplay }/> */}
        {title}
      </h2>

      <Card>
        {transcriptMediaCard}
        <Card.Header>
          <TranscriptMenu
            labels={ labels }
            updateSelectedLabel={ updateSelectedLabel }
            handleCreateAnnotation={ handleCreateAnnotation }
            handleEditAnnotation={ handleEditAnnotation }
            handleDeleteAnnotation={ handleDeleteAnnotation }
            onLabelCreate={ onLabelCreate }
            onLabelUpdate={ onLabelUpdate }
            onLabelDelete={ onLabelDelete }
          />
        </Card.Header>
        <SearchBar
          labels={ labels }
          speakersOptions={ speakersOptions }
          // handleSearch={ handleSearch }
          // handleLabelsSearchChange={ handleLabelsSearchChange }
          // handleSpeakersSearchChange={ handleSpeakersSearchChange }
          // handleShowParagraphsMatchingSearch={ handleShowParagraphsMatchingSearch }
        />

        <Card.Body
          // onDoubleClick={ handleWordClick }
          // onClick={ handleTimecodeClick }
          style={ { height: cardBodyHeight, overflow: 'scroll' } }
        >
          {highlights}

          {transcript && transcript.paragraphs && labels && annotations ? (
            <Paragraphs
              transcriptId={ transcriptId }
              labels={ labels }
              annotations={ annotations }
              transcript={ transcript }
              searchString={ searchString }
              showParagraphsMatchingSearch={ showParagraphsMatchingSearch }
              selectedOptionLabelSearch={ selectedOptionLabelSearch }
              selectedOptionSpeakerSearch={ selectedOptionSpeakerSearch }
              handleTimecodeClick={ handleTimecodeClick }
              handleWordClick={ handleWordClick }
              handleCreateAnnotation={ handleCreateAnnotation }
              handleDeleteAnnotation={ handleDeleteAnnotation }
              handleEditAnnotation={ handleEditAnnotation }
            />
          ) : null}
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
    ref: PropTypes.string,
    type: PropTypes.string,
  }),
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcript: PropTypes.shape({
    paragraphs: PropTypes.any,
  }),
  transcriptId: PropTypes.any,
};

export default TranscriptTabContent;
