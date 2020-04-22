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

  const onLabelCreate = async (newLabel) => {
    const docRef = await LabelsCollection.postItem(newLabel);
    newLabel.id = docRef.id;

    docRef.update({
      id: docRef.id
    });

    const tempLabels = labelsOptions;
    tempLabels.push(newLabel);
    setLabelsOptions(tempLabels);
  };

  const onLabelUpdate = async (labelId, updatedLabel) => {
    const tempLabels = labelsOptions;
    tempLabels.push(updatedLabel);
    setLabelsOptions(tempLabels);
    LabelsCollection.putItem(labelId, updatedLabel);
  };

  const onLabelDelete = async (labelId) => {
    const tempLabels = labelsOptions;
    tempLabels.splice(labelId, 1);
    setLabelsOptions(tempLabels);
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
                    isLabelsListOpen={ isLabelsListOpen }
                    labelsOptions={
                      labelsOptions && labelsOptions
                    }
                    onLabelUpdate={ onLabelUpdate }
                    onLabelCreate={ onLabelCreate }
                    onLabelDelete={ onLabelDelete }
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
              transcriptId={ transcriptId }
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

// class Transcript2 extends Component {
//   constructor(props) {
//     super(props);
//     this.videoRef = React.createRef();
//     this.state = {
//       // isVideoTranscriptPreviewShow: false,
//       searchString: '',
//       showParagraphsMatchingSearch: false,
//       selectedOptionLabelSearch: false,
//       selectedOptionSpeakerSearch: [],
//       sentenceToSearchCSS: '',
//       sentenceToSearchCSSInHighlights: '',
//       annotations: [],
//       isLabelsListOpen: true,
//       labelsOptions: this.props.labelsOptions,
//       currentTime: 0,
//     };
//   }

//   componentDidMount = () => {
//     // const api = this.context;
//     // api
//     //   .getAllAnnotations(this.props.projectId, this.props.transcriptId)
//     //   .then(json => {
//     //     // console.log(' api.getAllAnnotations', json);
//     //     this.setState({
//     //       annotations: json.annotations
//     //     });
//     //   });
//   };

//   // functions repeadrted from TranscriptAnnotate/index.js
//   handleTimecodeClick = (e) => {
//     if (e.target.classList.contains('timecode')) {
//       const wordEl = e.target;
//       this.videoRef.current.currentTime = wordEl.dataset.start;
//       this.videoRef.current.play();
//     }
//   };

//   handleWordClick = (e) => {
//     if (e.target.className === 'words') {
//       const wordEl = e.target;
//       this.videoRef.current.currentTime = wordEl.dataset.start;
//       this.videoRef.current.play();
//     }
//   };

//   handleShowParagraphsMatchingSearch = () => {
//     this.setState((state) => {
//       return {
//         showParagraphsMatchingSearch: !state.showParagraphsMatchingSearch,
//       };
//     });
//   };

//   handleSpeakersSearchChange = (selectedOptionSpeakerSearch) => {
//     this.setState({
//       selectedOptionSpeakerSearch,
//     });
//   };

//   handleSearch = (e) => {
//     // TODO: debounce to optimise
//     if (e.target.value !== '') {
//       const searchString = e.target.value;
//       this.setState({ searchString: searchString.toLowerCase() });
//       //  "debounce" to optimise
//       onlyCallOnce(this.highlightWords(searchString), 500);
//     }
//     // if empty string reset
//     else if (e.target.value === '') {
//       this.setState({
//         sentenceToSearchCSS: '',
//         searchString: '',
//       });
//     }
//   };

//   highlightWords = (searchString) => {
//     const listOfSearchWords = searchString.toLowerCase().trim().split(' ');
//     const pCSS = `.paragraph[data-paragraph-text*="${ listOfSearchWords.join(
//       ' '
//     ) }"]`;

//     const wordsToSearchCSS = listOfSearchWords.map((searchWord, index) => {
//       let res = `${ pCSS } > div > span.words[data-text="${ searchWord
//         .toLowerCase()
//         .trim() }"]`;
//       if (index < listOfSearchWords.length - 1) {
//         res += ', ';
//       }

//       return res;
//     });
//     // Need to add an extra span to search annotation hilights
//     // TODO: refactor to make more DRY
//     const wordsToSearchCSSInHighlights = listOfSearchWords.map(
//       (searchWord, index) => {
//         let res = `${ pCSS } > div  > span >span.words[data-text="${ searchWord
//           .toLowerCase()
//           .trim() }"]`;
//         if (index < listOfSearchWords.length - 1) {
//           res += ', ';
//         }

//         return res;
//       }
//     );
//     this.setState({
//       sentenceToSearchCSS: wordsToSearchCSS.join(' '),
//       sentenceToSearchCSSInHighlights: wordsToSearchCSSInHighlights.join(' '),
//     });
//   };

//   handleCreateAnnotation = (e) => {
//     const api = this.context;
//     const element = e.target;
//     // window.element = element;
//     const selection = getTimeFromUserWordsSelection();
//     if (selection) {
//       const { annotations } = this.state;
//       selection.labelId = element.dataset.labelId;
//       selection.note = '';
//       const newAnnotation = selection;
//       console.log('newAnnotation', newAnnotation);
//       api
//         .createAnnotation(
//           this.props.projectId,
//           this.props.transcriptId,
//           newAnnotation
//         )
//         .then((json) => {
//           const newAnnotationFromServer = json.annotation;
//           console.log('newAnnotationFromServer', newAnnotationFromServer);
//           // console.log('handleCreateAnnotation', newAnnotation);
//           // this.setState({
//           //   labelsOptions: json.labels
//           // });
//           const newAnnotationsSet = JSON.parse(JSON.stringify(annotations));
//           // newAnnotation.id = json.annotation.id;
//           // newAnnotationsList.push(newAnnotation);
//           newAnnotationsSet.push(newAnnotationFromServer);

//           this.setState({ annotations: newAnnotationsSet });
//         });
//     } else {
//       alert('Select some text in the transcript to highlight ');
//     }
//   };

//   handleDeleteAnnotation = (annotationId) => {
//     const api = this.context;
//     const { annotations } = this.state;
//     const newAnnotationsSet = annotations.filter((annotation) => {
//       return annotation.id !== annotationId;
//     });

//     const deepCloneOfNestedObjectNewAnnotationsSet = JSON.parse(
//       JSON.stringify(newAnnotationsSet)
//     );
//     api
//       .deleteAnnotation(
//         this.props.projectId,
//         this.props.transcriptId,
//         annotationId
//       )
//       .then(() => {
//         this.setState({
//           annotations: deepCloneOfNestedObjectNewAnnotationsSet,
//         });
//       });
//   };

//   // TODO: add server side via api
//   // similar to handleDeleteAnnotation filter to find annotation then replace text
//   handleEditAnnotation = (annotationId) => {
//     const api = this.context;
//     const { annotations } = this.state;
//     const newAnnotationToEdit = annotations.find((annotation) => {
//       return annotation.id === annotationId;
//     });
//     const newNote = prompt(
//       'Edit the text note of the annotation',
//       newAnnotationToEdit.note
//     );
//     if (newNote) {
//       newAnnotationToEdit.note = newNote;
//       api
//         .updateAnnotation(
//           this.state.projectId,
//           this.props.transcriptId,
//           annotationId,
//           newAnnotationToEdit
//         )
//         .then((json) => {
//           const newAnnotation = json.annotation;
//           // updating annotations client side by removing updating one
//           // and re-adding to array
//           // could be refactored using `findindex`
//           const newAnnotationsSet = annotations.filter((annotation) => {
//             return annotation.id !== annotationId;
//           });
//           newAnnotationsSet.push(newAnnotation);
//           this.setState({ annotations: newAnnotationsSet });
//         });
//     } else {
//       alert('all good nothing changed');
//     }
//   };

//   getCurrentWordTime = () => {
//     const { words } = this.props.transcript;

//     const currentTime = this.state.currentTime;
//     // if (this.videoRef && this.videoRef.current && this.videoRef.current.currentTime) {
//     //   currentTime = this.videoRef.current.currentTime;
//     // }
//     const currentWordTime = words.find((word) => {
//       if (currentTime >= word.start && currentTime <= word.end) {
//         return word.start;
//       }
//     });
//     if (currentWordTime !== undefined) {
//       return currentWordTime[0];
//     }

//     return 0;
//   };
// }

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
