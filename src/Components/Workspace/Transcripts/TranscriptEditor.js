import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { withAuthorization } from '../../Session';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import groupWordsInParagraphsBySpeakers from '../../PaperEditor/TranscriptsContainer/Paragraphs/group-words-by-speakers';

import Collection from '../../Firebase/Collection';
import { compress, decompress } from '../../../Util/gzip';
import Alert from 'react-bootstrap/Alert';

import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';

const ReactTranscriptEditor = React.lazy(() =>
  import('@bbc/react-transcript-editor')
);

const TranscriptEditor = ({ match, firebase }) => {
  const projectId = match.params.projectId;
  const transcriptId = match.params.transcriptId;

  const [ transcriptTitle, setTranscriptTitle ] = useState('');
  const [ fetchTranscript, setFetchTranscript ] = useState(false);

  const [ fetchProject, setFetchProject ] = useState(false);
  const [ projectTitle, setProjectTitle ] = useState('');

  const [ savedNotification, setSavedNotification ] = useState();
  const [ showNotification, setShowNotification ] = useState(false);

  const [ mediaType, setMediaType ] = useState('video');
  const [ mediaUrl, setMediaUrl ] = useState('');
  const [ mediaRef, setMediaRef ] = useState();

  const [ compressedGrouped, setCompressedGrouped ] = useState();
  const [ words, setWords ] = useState();
  const [ paragraphs, setParagraphs ] = useState();

  const transcriptEditorRef = useRef();

  const TranscriptsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/transcripts`
  );

  const ProjectsCollection = new Collection(firebase, '/projects');

  useEffect(() => {
    const getTranscript = async () => {
      setFetchTranscript(true);
      try {
        const { media, groupedc, title } = await TranscriptsCollection.getItem(
          transcriptId
        );

        setMediaRef(media.ref);
        setMediaType(media.type.split('/')[0]);

        setCompressedGrouped(groupedc);
        setTranscriptTitle(title);
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (!compressedGrouped && !fetchTranscript) {
      getTranscript();
    }

    return () => {};
  }, [
    TranscriptsCollection,
    transcriptId,
    firebase.storage,
    fetchTranscript,
    compressedGrouped,
  ]);

  useEffect(() => {
    const getDownloadURL = async () => {
      const url = await firebase.storage.storage.ref(mediaRef).getDownloadURL();
      setMediaUrl(url);
    };

    if (mediaRef) {
      getDownloadURL();
    }

    return () => {
      setMediaUrl('');
    };
  }, [ firebase.storage.storage, mediaRef ]);

  useEffect(() => {
    const getProject = async () => {
      setFetchProject(true);
      try {
        const data = await ProjectsCollection.getItem(projectId);
        setProjectTitle(data.title);
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };
    if (!projectTitle && !fetchProject) {
      getProject();
    }

    return () => {};
  }, [ ProjectsCollection, projectId, projectTitle, fetchProject ]);

  useEffect(() => {
    const getTranscriptData = (grouped) => {
      const result = grouped.reduce((transcript, data) => {
        const w = [ ... data.words ];

        if (!data.start || !data.end) {
          const firstWord = w[0];
          const lastWord = w[w.length - 1];
          data.start = parseFloat(firstWord.start);
          data.end = parseFloat(lastWord.end);
        }

        delete(data.words);
        transcript.paragraphs.push(data);
        transcript.words = transcript.words.concat(w);

        return transcript;
      }, { paragraphs: [], words: [] });

      console.log(result);
      setParagraphs(result.paragraphs);
      setWords(result.words);
    };
    //   const paras = grouped.map((data, i) => {
    //     data.id = i;

    //     if (!data.start || !data.end) {
    //       const firstWord = data.words[0];
    //       const lastWord = data.words[data.words.length - 1];
    //       data.start = parseFloat(firstWord.start);
    //       data.end = parseFloat(lastWord.end);
    //     }

    //     return data;
    //   });

    //   setParagraphs(paras);
    // };

    if (compressedGrouped) {
      const grouped = decompress(compressedGrouped);
      getTranscriptData(grouped);
      // setParagraphs(() => getParagraphs(grouped));
      // setWords(grouped.map((p) => p.words).flat());
    }

    return () => {};
  }, [ compressedGrouped ]);

  const updateTranscript = async (id, item) => {
    await TranscriptsCollection.putItem(id, item);
  };

  const handleAlertClose = () => {
    setShowNotification(false);
  };

  const saveButtonHandler = async () => {
    // TODO: decide how to deal with transcript corrections
    // exporting digitalpaperedit in @bbc/react-transcript-editor@latest doesn't give you
    // corrected text with timecodes, only "original" uncorrected text even if transcript might
    // have been corrected, because of outstandin PR in bbc/react-transcript-editor
    // https://github.com/bbc/react-transcript-editor/pull/144
    // which should be addressed after https://github.com/bbc/react-transcript-editor/pull/160
    //
    // Other option is to export as `txtspeakertimecodes` or `txt` and reallign server side using Aeneas
    //
    // TranscriptEditor - export options: txtspeakertimecodes - draftjs - txt - digitalpaperedit
    const { data } = transcriptEditorRef.current.getEditorContent(
      'digitalpaperedit'
    );

    const groupedc = groupWordsInParagraphsBySpeakers(
      data.words,
      data.paragraphs
    );
    data.groupedc = firebase.uint8ArrayBlob(compress(groupedc));

    try {
      await updateTranscript(transcriptId, data);
      setShowNotification(true);
      setSavedNotification(
        <Alert onClose={ handleAlertClose } dismissible variant="success">
          <Alert.Heading>Transcript saved</Alert.Heading>
          Transcript: <b>{transcriptTitle}</b> has been saved
        </Alert>
      );
    } catch (error) {
      console.error('Error saving transcript::', error);
      setShowNotification(true);
      setSavedNotification(
        <Alert onClose={ handleAlertClose } dismissible variant="danger">
          <Alert.Heading>Error saving transcript</Alert.Heading>
          There was an error trying to save this transcript:{' '}
          <b>{transcriptTitle}</b>
        </Alert>
      );
    }
  };

  return (
    <>
      <Container style={ { marginBottom: '5em' } } fluid>
        <br />
        <Row>
          <Col sm={ 12 } md={ 11 } ld={ 11 } xl={ 11 }>
            <Breadcrumb
              items={ [
                {
                  name: 'Projects',
                  link: '/projects',
                },
                {
                  name: `Project: ${ projectTitle }`,
                  link: `/projects/${ projectId }`,
                },
                {
                  name: `Transcript: ${ transcriptTitle }`,
                },
                {
                  name: 'Correct',
                },
              ] }
            />
          </Col>

          <Col xs={ 12 } sm={ 1 } md={ 1 } ld={ 1 } xl={ 1 }>
            <Button
              variant="outline-secondary"
              onClick={ saveButtonHandler }
              size="lg"
              block
            >
              Save
            </Button>
            <br />
          </Col>
        </Row>
        {showNotification ? savedNotification : null}
        <Suspense fallback={ <div>Loading...</div> }>
          {words && paragraphs ? (
            <ReactTranscriptEditor
              transcriptData={ { words: words, paragraphs: paragraphs } } // Transcript json
              // TODO: move url server side
              mediaUrl={ mediaUrl } // string url to media file - audio or video
              isEditable={ true } // se to true if you want to be able to edit the text
              sttJsonType={ 'digitalpaperedit' } // the type of STT Json transcript supported.
              //  TODO: check if name has changed in latest version
              title={ transcriptTitle }
              // fileName={ this.state.projectTitle }// optional*
              ref={ transcriptEditorRef }
              mediaType={ mediaType }
            />
          ) : null}
        </Suspense>
      </Container>
    </>
  );
};

TranscriptEditor.propTypes = {
  firebase: PropTypes.shape({
    storage: PropTypes.shape({
      storage: PropTypes.shape({
        ref: PropTypes.func,
      }),
    }),
    uint8ArrayBlob: PropTypes.func,
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any,
      transcriptId: PropTypes.any,
    }),
  }),
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(TranscriptEditor);
