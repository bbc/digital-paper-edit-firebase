/* eslint-disable no-undef */
import PropTypes from 'prop-types';
import React, { Component, useRef, useEffect, useState } from 'react';
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
const makeListOfUniqueSpeakers = (paragraphs) => {
  const result = [];
  const map = new Map();
  console.log('ARRAY', paragraphs);
  if (paragraphs) {
    for (const paragraph of paragraphs) {
      if (!map.has(paragraph.speaker)) {
        map.set(paragraph.speaker, true); // set any value to Map
        result.push({
          value: paragraph.speaker,
          label: paragraph.speaker,
        });
      }
    }
  }

  return result;
};

const Transcript = (props) => {
  const videoRef = useRef();
  const transcriptId = props.transcriptId;
  const projectId = props.projectId;
  // isVideoTranscriptPreviewShow: false,

  const [ searchString, setSearchString ] = useState('');
  const [ showParagraphsMatchingSearch, setShowParagraphsMatchingSearch ] = useState(false);
  const [ selectedOptionLabelSearch, setSelectedOptionLabelSearch ] = useState(false);
  const [ selectedOptionSpeakerSearch, setSelectedOptionSpeakerSearch ] = useState([]);
  const [ sentenceToSearchCSS, setSentenceToSearchCSS ] = useState('');
  const [ sentenceToSearchCSSInHighlights, setSentenceToSearchCSSInHighlights ] = useState('');
  const [ annotations, handleCreateAnnotation ] = useState([]);
  const [ isLabelsListOpen, setIsLabelsListOpen ] = useState(true);
  const [ labelsOptions, setLabelsOptions ] = useState(props.labelsOptions);
  const [ currentTime, setCurrentTime ] = useState();

  useEffect(() => {
    // const api = this.context;
    // api
    //   .getAllAnnotations(this.props.projectId, this.props.transcriptId)
    //   .then(json => {
    //     // console.log(' api.getAllAnnotations', json);
    //     this.setState({
    //       annotations: json.annotations
    //     });
    //   });
  }, [
    projectId,
    transcriptId
  ]);

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

  const cardBodyHeight = props.mediaType === 'audio' ? '100vh' : '60vh';

  let transcriptMediaCard;

  if (props.mediaType === 'audio') {
    transcriptMediaCard = (
      <Card.Header>
        <audio
          src={ props.url }
          ref={ videoRef }
          onTimeUpdate={ (e) => {
            setState({ currentTime: e.target.currentTime });
          } }
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
          src={ props.url }
          ref={ videoRef }
          onTimeUpdate={ (e) => {
            setState({ currentTime: e.target.currentTime });
          } }
          style={ {
            width: '100%',
            backgroundColor: 'black',
          } }
          controls
        />
      </Card.Header>
    );
  }

  return (
    <>
      <style scoped>
        {/* This is to style of the Paragraph component programmatically */}
        {`${
          sentenceToSearchCSS
        } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
        {`${
          sentenceToSearchCSSInHighlights
        } { background-color: ${ 'yellow' }; text-shadow: 0 0 0.01px black }`}
      </style>

      <h2
        className={ [ 'text-truncate', 'text-muted' ].join(' ') }
        title={ `Transcript Title: ${ props.title }` }
      >
        {/* <FontAwesomeIcon icon={ this.state.isVideoTranscriptPreviewShow === 'none' ? faEye : faEyeSlash } onClick={ this.handleVideoTranscriptPreviewDisplay }/> */}
        {props.title}
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
                    onClick={ handleCreateAnnotation }
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
                  <Dropdown.Menu onClick={ handleCreateAnnotation }>
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
          speakersOptions={
            props.transcript && props.transcript.paragraphs
              ? makeListOfUniqueSpeakers(props.transcript.paragraphs)
              : null
          }
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

          {props.transcript && (
            <Paragraphs
              labelsOptions={
                labelsOptions && labelsOptions
              }
              // annotations={
              //   annotations ? annotations : []
              // }
              transcriptJson={ props.transcript }
              // searchString={
              //   searchString ? searchString : ''
              // }
              // showParagraphsMatchingSearch={
              //   showParagraphsMatchingSearch
              // }
              // selectedOptionLabelSearch={
              //   selectedOptionLabelSearch
              //     ? selectedOptionLabelSearch
              //     : []
              // }
              // selectedOptionSpeakerSearch={
              //   selectedOptionSpeakerSearch
              //     ? selectedOptionSpeakerSearch
              //     : []
              // }
              transcriptId={ props.transcriptId }
              // handleTimecodeClick={ handleTimecodeClick }
              // handleWordClick={ handleWordClick }
              // handleDeleteAnnotation={ handleDeleteAnnotation }
              // handleEditAnnotation={ handleEditAnnotation }
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

Transcript.propTypes = {
  labelsOptions: PropTypes.any,
  mediaType: PropTypes.any,
  projectId: PropTypes.any,
  title: PropTypes.any,
  transcript: PropTypes.any,
  transcriptId: PropTypes.any,
  url: PropTypes.any,
};

export default Transcript;
