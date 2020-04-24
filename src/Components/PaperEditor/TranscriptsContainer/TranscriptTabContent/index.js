/* eslint-disable no-undef */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Transcript from '../Transcript';
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
  const [ url, setUrl ] = useState();

  const [ labels, setLabels ] = useState();
  const [ annotations, setAnnotations ] = useState();

  const [ searchString, setSearchString ] = useState('');
  const [ showMatch, setShowMatch ] = useState(false);
  const [ searchLabels, setLabelSearch ] = useState([]);
  const [ searchSpeakers, setSpeakerSearch ] = useState([]);
  const [ paragraphCSS, setParagraphsCSS ] = useState('');
  const [ searchHighlightCSS, setSearchHighlightCSS ] = useState('');
  const [ currentTime, setCurrentTime ] = useState();
  const [ isHighlighting, setIsHighlighting ] = useState(false);

  const mediaType = media ? media.type : '';

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

    return () => { };
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

  useEffect(() => {
    const highlightWords = (words) => {
      const dataParagraphText = words.join(' ');

      const css = words.reduce(
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
        const words = searchString
          .toLowerCase()
          .trim()
          .split(' ')
          .map((w) => w.trim());
        const css = highlightWords(words);
        setParagraphsCSS(css.paragraphs);
        setSearchHighlightCSS(css.search);
        // onlyCallOnce(highlightWords(words), 500);
        setIsHighlighting(false);
      } else {
        setParagraphsCSS('');
        setSearchString('');
      }
    }

    return () => {};
  }, [ isHighlighting, searchString ]);

  const showLabelsReference = () => {};

  const handleLabelsSearchChange = (selectedOptionLabelSearch) => {};

  const handleSearch = (e) => {
    // TODO: debounce to optimise
    const text = e.target.value;
    if (text) {
      setSearchString(text);
    }
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
        id: docRef.id
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

  let mediaElement;

  if (mediaType.startsWith('audio')) {
    mediaElement = (
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
    );
  } else {
    mediaElement = (
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
    );
  }

  let speakers = null;
  if (transcript && transcript.paragraphs) {
    speakers = getSpeakerLabels(transcript.paragraphs);
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
          {"{ background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }"}
          {"{ background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }"}
        </style>
      )
      }

      <h2
        className={ [ 'text-truncate', 'text-muted' ].join(' ') }
        title={ `Transcript Title: ${ title }` }
      >
        {/* <FontAwesomeIcon icon={ this.state.isVideoTranscriptPreviewShow === 'none' ? faEye : faEyeSlash } onClick={ this.handleVideoTranscriptPreviewDisplay }/> */}
        {title}
      </h2>

      <Card>
        <Card.Header>{mediaElement}</Card.Header>
        <Card.Header>
          <TranscriptMenu
            labels={ labels }
            updateLabelSelection={ updateLabelSelection }
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
          speakers={ speakers }
          handleSearch={ handleSearch }
          selectLabel={ () => setLabelSearch }
          selectSpeaker={ () => setSpeakerSearch }
          toggleShowMatch={ () => setShowMatch(!showMatch) }
        />

        <Card.Body
          // onDoubleClick={ handleWordClick }
          // onClick={ handleTimecodeClick }
          style={ { height: cardBodyHeight, overflow: 'scroll' } }
        >
          {highlights}

          {transcript && transcript.paragraphs && labels && annotations ? (
            <Transcript
              transcriptId={ transcriptId }
              labels={ labels }
              annotations={ annotations }
              transcript={ transcript }
              searchString={ searchString }
              showMatch={ showMatch }
              searchLabels={ searchLabels }
              searchSpeakers={ searchSpeakers }
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
