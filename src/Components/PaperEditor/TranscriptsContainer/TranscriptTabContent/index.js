/* eslint-disable no-undef */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Transcript from '../Transcript';
import onlyCallOnce from '../../../../Util/only-call-once/index.js';
import SearchBar from '../SearchBar';
import Collection from '../../../Firebase/Collection';
import TranscriptMenu from './TranscriptMenu';

/**
 * Makes list of unique speakers
 * from transcript.paragraphs list
 * to be used in react-select component
 *
 * TODO: decide if to move server side, and return unique list of speaker to client
 * Or if to move to separate file as util, perhaps generalise as reusable funciton?
 *
 * https://codeburst.io/javascript-array-distinct-5edc93501dc4
 */
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
  // isVideoTranscriptPreviewShow: false,

  const { transcriptId, projectId, title, firebase, media, transcript } = props;
  const [ url, setUrl ] = useState();
  const [ labels, setLabels ] = useState(props.labels);
  const [ searchString, setSearchString ] = useState('');

  const [
    showMatch,
    setShowMatch,
  ] = useState(false);
  const [ searchLabels, setLabelSearch ] = useState(
    []
  );
  const [
    searchSpeakers,
    setSpeakerSearch,
  ] = useState([]);
  const [ sentenceToSearchCSS, setSentenceToSearchCSS ] = useState('');
  const [
    sentenceToSearchCSSInHighlights,
    setSentenceToSearchCSSInHighlights,
  ] = useState('');
  const [ annotations, setAnnotations ] = useState([]);
  const [ currentTime, setCurrentTime ] = useState();

  const mediaType = media ? media.type : '';

  const LabelsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/labels`
  );

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

  const handleSearch = (e) => {
    // TODO: debounce to optimise
    const text = e.target.value;
    if (text) {
      setSearchString(text.toLowerCase());
      onlyCallOnce(highlightWords(searchString), 500);
    } else if (text === '') {
      setSentenceToSearchCSS('');
      setSearchString('');
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

  const handleDeleteAnnotation = (annotationId) => {
    const newAnnotationsSet = annotations.filter((annotation) => {
      return annotation.id !== annotationId;
    });

    // const deepCloneOfNestedObjectNewAnnotationsSet = JSON.parse(
    //   JSON.stringify(newAnnotationsSet)
    // );
    // delete using Firebase
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
      // crud annotation
    } else {
      alert('all good nothing changed');
    }
  };

  const onLabelCreate = async (newLabel) => {
    const docRef = await LabelsCollection.postItem(newLabel);
    newLabel.id = docRef.id;

    docRef.update({
      id: docRef.id
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

  console.log('tr', transcript);

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
        <Card.Header>
          {mediaElement}
        </Card.Header>
        <Card.Header>
          <TranscriptMenu
            labels={ labels }
            handleClick={ () => setAnnotations() }
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

          {transcript && transcript.paragraphs && transcript.words ? (
            <Transcript
              transcriptId={ transcriptId }
              labels={ labels }
              annotations={ annotations }
              transcript={ transcript }
              searchString={ searchString }
              showMatch={ showMatch }
              searchLabels={
                searchLabels
              }
              searchSpeakers={
                searchSpeakers
              }
              handleTimecodeClick={ handleTimecodeClick }
              handleWordClick={ handleWordClick }
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
  labels: PropTypes.any,
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
