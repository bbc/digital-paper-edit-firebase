import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { withAuthorization } from '../../Session';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import Alert from 'react-bootstrap/Alert';

import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';

const ReactTranscriptEditor = React.lazy(() =>
  import('@bbc/react-transcript-editor')
);

const TranscriptEditor = ({ match, collections }) => {
  const projectId = match.params.projectId;
  const transcriptId = match.params.transcriptId;

  const [ transcriptTitle, setTranscriptTitle ] = useState('');
  const [ projectTitle, setProjectTitle ] = useState('');

  const [ savedNotification, setSavedNotification ] = useState();
  const [ showNotification, setShowNotification ] = useState(false);

  const [ mediaType, setMediaType ] = useState('video');
  const [ mediaUrl, setMediaUrl ] = useState('');

  const [ words, setWords ] = useState();
  const [ paragraphs, setParagraphs ] = useState();

  const transcriptEditorRef = useRef();

  useEffect(() => {
    const getCompressedTranscript = async () => {
      const transcript = await collections.getTranscriptWithDecompression(projectId, transcriptId);
      const { paragraphs: ps, words: ws } = transcript;

      setParagraphs(ps);
      setWords(ws);
    };

    const getDownloadURL = async () => {
      const url = await collections.getTranscriptMediaUrl(projectId, transcriptId);
      setMediaUrl(url);
    };

    if (collections) {
      const project = collections.getProject(projectId);
      setProjectTitle(project.title);

      const transcript = collections.getTranscript(projectId, transcriptId);
      const { media, title } = transcript;
      setMediaType(media.type.split('/')[0]);
      setTranscriptTitle(title);

      getCompressedTranscript();
      getDownloadURL();
    }

    return () => {
      setParagraphs();
      setWords();
      setMediaUrl('');
    };
  }, [ collections, projectId, transcriptId ]);

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
      await collections.updateTranscript(projectId, transcriptId, data);
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
  collections: PropTypes.shape({
    getDownloadURL: PropTypes.func,
    getProject: PropTypes.func,
    getTranscript: PropTypes.func,
    updateTranscript: PropTypes.func
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any,
      transcriptId: PropTypes.any
    })
  })
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(TranscriptEditor);
