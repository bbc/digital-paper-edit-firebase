/* eslint-disable no-undef */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Paragraphs from './Paragraphs/index.js';
import LabelsList from './LabelsList/index.js';
import onlyCallOnce from '../../../Util/only-call-once/index.js';
import getTimeFromUserWordsSelection from './get-user-selection.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchBar from '@bbc/digital-paper-edit-storybook/SearchBar';
import { faHighlighter, faCog } from '@fortawesome/free-solid-svg-icons';
import Collection from '../../Firebase/Collection';

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

const Transcript = (props) => {
  const videoRef = useRef();
  // isVideoTranscriptPreviewShow: false,

  const { transcriptId, projectId, title, firebase, media, transcript } = props;
  const mediaType = media ? media.type : '';
  const [ url, setUrl ] = useState();

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
  const [ annotations, setAnnotations ] = useState([]);
  const [ isLabelsListOpen, setIsLabelsListOpen ] = useState(true);
  const [ labelsOptions, setLabelsOptions ] = useState(props.labelsOptions);
  const [ currentTime, setCurrentTime ] = useState();

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

  const onLabelCreate = (newLabel) => {
    console.log('new label', newLabel);
    const tempLabels = labelsOptions;
    tempLabels.push(newLabel);
    setLabelsOptions(tempLabels);
    LabelsCollection.postItem(newLabel);
  };

  const onLabelUpdate = (updatedLabel) => {
    console.log('updated', updatedLabel);
  };

  const onLabelDelete = async (labelId) => {
    console.log('labelsoptions', labelsOptions);
    const tempLabels = labelsOptions;
    tempLabels.splice(labelId, 1);
    setLabelsOptions(tempLabels);
    console.log('labelsoptions after deleting', labelsOptions);
    // handleSaveLabels();
    await LabelsCollection.deleteItem(labelId);
  };

  const showLabelsReference = () => {};

  const handleLabelsSearchChange = (selectedOptionLabelSearch) => {};

  const handleSearch = (e) => {
    // TODO: debounce to optimise
    if (e.target.value !== '') {
      const text = e.target.value;
      setSearchString( text.toLowerCase() );
      //  "debounce" to optimise
      onlyCallOnce(highlightWords(searchString), 500);
    }
    // if empty string reset
    else if (e.target.value === '') {
      setSentenceToSearchCSS('');
      setSearchString('');
    }
  };

  const highlightWords = text => {
    const words = text.toLowerCase().trim().split(' ');
    const cssName = words.join(' ');
    const paragraphCSS = `.paragraph[data-paragraph-text*="${ cssName }"]`;

    const css = words.reduce((res, word) => {
      res.paragraphs.push(`${ paragraphCSS } > div > span.words[data-text="${ word }"]`);
      res.search.push(`${ paragraphCSS } > div > span >span.words[data-text="${ word }"]`);

      return res;
    }, { paragraphs: [], search: [] });
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

  const currentWordTime = currentTime;
  const unplayedColor = 'grey';

  // Time to the nearest half second
  const time = Math.round(currentWordTime * 4.0) / 4.0;
  const highlights = (
    <style scoped>
      {`span.words[data-prev-times~="${ Math.floor(
        time
      ) }"][data-transcript-id="${
        Transcript.transcriptId
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
          onTimeUpdate={ (e) =>
            setCurrentTime( e.target.currentTime )
          }
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
          onTimeUpdate={ (e) =>
            setCurrentTime( e.target.currentTime )
          }
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
          <Row>
            <Col xs={ 12 }>
              <ButtonGroup style={ { width: '100%' } }>
                <Dropdown as={ ButtonGroup } style={ { width: '100%' } }>
                  <Button
                    variant="outline-secondary"
                    data-label-id={ 'default' }
                    onClick={ setAnnotations }
                  >
                    <FontAwesomeIcon icon={ faHighlighter } flip="horizontal" />{' '}
                    Highlight
                    {/* */}
                  </Button>
                  <Dropdown.Toggle
                    split
                    variant="outline-secondary"
                    data-lable-id={ 0 }
                  />
                  <Dropdown.Menu onClick={ setAnnotations }>
                    {labelsOptions &&
                      labelsOptions.map((label) => {
                        return (
                          <Dropdown.Item
                            key={ `label_id_${ label.id }` }
                            data-label-id={ label.id }
                          >
                            <Row data-label-id={ label.id }>
                              <Col
                                xs={ 1 }
                                style={ { backgroundColor: label.color } }
                                data-label-id={ label.id }
                              ></Col>
                              <Col xs={ 1 } data-label-id={ label.id }>
                                {label.label}
                              </Col>
                            </Row>
                          </Dropdown.Item>
                        );
                      })}
                  </Dropdown.Menu>
                </Dropdown>

                <DropdownButton
                  drop={ 'right' }
                  as={ ButtonGroup }
                  title={ <FontAwesomeIcon icon={ faCog } /> }
                  id="bg-nested-dropdown"
                  variant="outline-secondary"
                >
                  <LabelsList
                  // isLabelsListOpen={ isLabelsListOpen }
                  // labelsOptions={
                  //   labelsOptions && labelsOptions
                  // }
                  // onLabelUpdate={ onLabelUpdate }
                  // onLabelCreate={ onLabelCreate }
                  // onLabelDelete={ onLabelDelete }
                  />
                </DropdownButton>
              </ButtonGroup>
            </Col>
          </Row>
        </Card.Header>
        <SearchBar
          labelsOptions={ labelsOptions }
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

          {transcript && transcript.paragraphs ? (
            <Paragraphs
              transcriptId={ transcriptId }
              labelsOptions={ labelsOptions }
              annotations={ annotations }
              transcript={ transcript }
              searchString={ searchString }
              showParagraphsMatchingSearch={ showParagraphsMatchingSearch }
              selectedOptionLabelSearch={
                selectedOptionLabelSearch
              }
              selectedOptionSpeakerSearch={
                selectedOptionSpeakerSearch
              }
              // handleTimecodeClick={ handleTimecodeClick }
              // handleWordClick={ handleWordClick }
              // handleDeleteAnnotation={ handleDeleteAnnotation }
              // handleEditAnnotation={ handleEditAnnotation }
            />
          ) : null}
        </Card.Body>
      </Card>
    </>
  );
};

Transcript.propTypes = {
  firebase: PropTypes.shape({
    storage: PropTypes.shape({
      storage: PropTypes.shape({
        ref: PropTypes.func
      })
    })
  }),
  labelsOptions: PropTypes.any,
  media: PropTypes.shape({
    ref: PropTypes.string,
    type: PropTypes.string
  }),
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcript: PropTypes.shape({
    paragraphs: PropTypes.any
  }),
  transcriptId: PropTypes.any
};

export default Transcript;
