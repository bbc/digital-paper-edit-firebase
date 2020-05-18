import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import { withAuthorization } from '../../Session';
import { TranscriptEditor as ReactTranscriptEditor } from '@bbc/react-transcript-editor';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import Collection from '../../Firebase/Collection';
import Alert from 'react-bootstrap/Alert';

import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';

const TranscriptEditor = ({ match, firebase }) => {
  const projectId = match.params.projectId;
  const transcriptId = match.params.transcriptId;

  const [ transcriptData, setTranscriptData ] = useState();
  const [ projectTitle, setProjectTitle ] = useState('');
  const [ transcriptTitle, setTranscriptTitle ] = useState('');
  const [ savedNotification, setSavedNotification ] = useState();
  const [ showNotification, setShowNotification ] = useState(false);
  const [ mediaType, setMediaType ] = useState('video');
  const [ mediaUrl, setMediaUrl ] = useState('');

  const transcriptEditorRef = useRef();

  const TranscriptsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/transcripts`
  );

  const ProjectsCollection = new Collection(firebase, '/projects');

  useEffect(() => {
    const getTranscript = async () => {
      try {
        const {
          media,
          paragraphs,
          words,
          title,
        } = await TranscriptsCollection.getItem(transcriptId);
        const url = await firebase.storage.storage
          .ref(media.ref)
          .getDownloadURL();

        setMediaUrl(url);
        setMediaType(media.type.split('/')[0]);

        setTranscriptData({
          paragraphs: paragraphs,
          words: words,
        });

        setTranscriptTitle(title);
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    const getProject = async () => {
      try {
        const data = await ProjectsCollection.getItem(projectId);
        setProjectTitle(data.title);
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (!transcriptData) {
      getTranscript();
    }
    if (!projectTitle) {
      getProject();
    }

    return () => {};
  }, [
    ProjectsCollection,
    TranscriptsCollection,
    projectId,
    projectTitle,
    transcriptData,
    transcriptId,
    firebase.storage,
  ]);

  const updateTranscript = async (id, item) => {
    await TranscriptsCollection.putItem(id, item);

    return item;
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
        {transcriptData && (
          <ReactTranscriptEditor
            transcriptData={ transcriptData } // Transcript json
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
        )}
      </Container>
    </>
  );
};

TranscriptEditor.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(TranscriptEditor);
