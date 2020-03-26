import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import { withAuthorization } from '../../Session';
// import './index.module.css';
// import styles from './Transcript.module.css';
// TODO: perhaps import TranscriptEditor on componentDidMount(?) to defer the load for later
// https://facebook.github.io/create-react-app/docs/code-splitting
import { TranscriptEditor as ReactTranscriptEditor } from '@bbc/react-transcript-editor';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import Collection from '../../Firebase/Collection';

import CustomAlert from '@bbc/digital-paper-edit-storybook/CustomAlert';
import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';

const TranscriptEditor = props => {
  const projectId = props.match.params.projectId;
  const transcriptId = props.match.params.transcriptId;

  const [ transcriptData, setTranscriptData ] = useState();
  const [ mediaUrl, setMediaUrl ] = useState('');
  const [ projectTitle, setProjectTitle ] = useState('');
  const [ transcriptTitle, setTranscriptTitle ] = useState('');
  const [ savedNotification, setSavedNotification ] = useState();
  const [ mediaType, setMediaType ] = useState('video');

  const transcriptEditorRef = useRef();

  const TranscriptsCollection = new Collection(
    props.firebase,
    `/projects/${ projectId }/transcripts`
  );

  const ProjectsCollection = new Collection(props.firebase, '/projects');

  useEffect(() => {
    const getTranscript = async () => {
      try {
        const data = await TranscriptsCollection.getItem(transcriptId);
        setMediaUrl(data.media.url);
        setMediaType(data.media.type);
        setTranscriptData({
          paragraphs: data.paragraphs,
          words: data.words
        });

        setTranscriptTitle(data.title);
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
  },
  [ ProjectsCollection, TranscriptsCollection, projectId, projectTitle, transcriptData, transcriptId ]);

  const updateTranscript = async (id, item) => {
    await TranscriptsCollection.putItem(id, item);

    return item;
  };

  const saveButtonHandler = async () => {
    alert('save to server');

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
      setSavedNotification(
        <CustomAlert
          dismissable={ true }
          variant='success'
          heading='Transcript saved'
          message=
            { <p>Transcript: <b>{transcriptTitle}</b> has been saved</p> }
        />
      );
    } catch (error) {
      console.error('error saving transcript:: ', error);
      setSavedNotification(<CustomAlert
        dismissable={ true }
        variant='danger'
        heading='Error saving transcript'
        message={
          <p>
            There was an error trying to save this transcript: <b>{transcriptTitle}</b>
          </p>
        }
      />);
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
                  link: '/projects'
                },
                {
                  name: `Project: ${ projectTitle }`,
                  link: `/projects/${ projectId }`
                },
                {
                  name: `Transcript: ${ transcriptTitle }`
                },
                {
                  name: 'Correct'
                }
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
        {savedNotification}
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
  match: PropTypes.any
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(TranscriptEditor);
