import React, { useState, useEffect } from 'react';
import { withAuthorization } from '../Session';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';
import TranscriptsContainer from './TranscriptsContainer';
import ProgrammeScriptContainer from './ProgrammeScriptContainer';
import PropTypes from 'prop-types';
import Collection from '../Firebase/Collection';

const PaperEditor = (props) => {
  const projectId = props.match.params.projectId;
  const papereditId = props.match.params.papereditId;
  const videoHeight = props.videoHeight; //('10em');
  const labelsOptions = props.labelsOptions; //[]

  const [ projectTitle, setProjectTitle ] = useState('');
  const [ paperEditTitle, setPaperEditTitle ] = useState('');
  const [ transcripts, setTranscripts ] = useState(null);
  const [ annotations, setAnnotations ] = useState([]);

  const [ isTranscriptsShown, setIsTranscriptsShown ] = useState(true);
  const [ isProgramScriptShown, setIsProgramScriptShown ] = useState(true);

  const Projects = new Collection(props.firebase, 'projects');
  const PaperEdits = new Collection(props.firebase,
    `/projects/${ projectId }/paperedits`);
  const Transcriptions = new Collection(props.firebase,
    `/projects/${ projectId }/transcripts`);

  useEffect(() => {
    const getProject = async () => {
      try {
        const project = await Projects.getItem(projectId);
        setProjectTitle(project.title);
      } catch (e) {
        console.error('Could not get Project Id: ', papereditId, e);
      }
    };
    const getPaperEdit = async () => {
      try {
        const paperEdit = await PaperEdits.getItem(papereditId);
        setPaperEditTitle(paperEdit.title);
      } catch (e) {
        console.error('Could not get PaperEdit Id: ', papereditId, e);
      }
    };
    const getTranscripts = async () => {
      try {
        Transcriptions.collectionRef.onSnapshot(snapshot => {
          setTranscripts(snapshot.docs.map(doc => {
            return { ...doc.data(), id: doc.id, display: true };
          }));
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    const getAnnotations = async () => {
      try {
      } catch (error) {
        console.error('Error getting annotations: ', error);
      }
    };

    if (!transcripts) {
      getProject();
      getPaperEdit();
      getTranscripts();
      getAnnotations();
    }

    return () => {};
  }, [ transcripts, PaperEdits, Projects, Transcriptions.collectionRef, papereditId, projectId, annotations ]);

  const toggleTranscripts = () => {
    if (isProgramScriptShown) {
      setIsTranscriptsShown(!isTranscriptsShown);
    }
  };

  const toggleProgramScript = () => {
    if (isTranscriptsShown) {
      setIsProgramScriptShown(!isProgramScriptShown);
    }
  };

  const toggleButton = (text, isShown, toggle) => {
    let variant, icon, actionText;

    if (isShown) {
      variant = 'secondary';
      icon = faAngleDown;
      actionText = 'hide';
    } else {
      variant = 'outline-secondary';
      icon = faAngleUp;
      actionText = 'show';
    }

    const Icon = <FontAwesomeIcon icon={ icon }/>;

    return (
      <Button
        onClick={ toggle }
        variant={ variant }>
        {text} {Icon} {actionText}
      </Button>
    );
  };

  const breadcrumb = (
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
          name: 'PaperEdits'
        },
        {
          name: `${ paperEditTitle }`
        }
      ] }
    />
  );

  let TranscriptEl = <>
    <br />
    <br />
    <i>No Transcripts, create a transcript to get started</i>
  </>;

  if (transcripts) {
    TranscriptEl = <TranscriptsContainer
      projectId={ projectId }
      transcripts={ transcripts }
      labelsOptions={ labelsOptions }
    />;
  }

  let ProgrammeScriptEl = null;
  if (transcripts) {
    ProgrammeScriptEl = <ProgrammeScriptContainer
      projectId={ projectId }
      papereditId={ papereditId }
      transcripts={ transcripts }
      videoHeight={ videoHeight }
    />;
  }

  const transcriptsColumn = (el) => {
    const display = isTranscriptsShown ? 'block' : 'none';
    if (isProgramScriptShown) {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span:  7, offset: 0 } }
          md={ { span: 7, offset: 0 } }
          lg={ { span: 7, offset: 0 } }
          xl={ { span: 7, offset: 0 } }
          style={ { display: { display } } }
        >
          {el}
        </Col>
      );
    } else {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span:  12, offset: 0 } }
          md={ { span: 12, offset: 0 } }
          lg={ { span: 10, offset: 1 } }
          xl={ { span: 10, offset: 1 } }
          style={ { display: { display } } }
        >
          {el}
        </Col>
      );
    }
  };

  const programmeScriptColumn = (el) => {
    const display = isTranscriptsShown ? 'block' : 'none';
    if (isProgramScriptShown) {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span:  5, offset: 0 } }
          md={ { span: 5, offset: 0 } }
          lg={ { span: 5, offset: 0 } }
          xl={ { span: 5, offset: 0 } }
          style={ { display: { display } } }
        >
          {el}
        </Col>
      );
    } else {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span:  12, offset: 0 } }
          md={ { span: 12, offset: 0 } }
          lg={ { span: 10, offset: 1 } }
          xl={ { span: 8, offset: 2 } }
          style={ { display: { display } } }
        >
          {el}
        </Col>
      );
    }
  };

  return (
    <Container style={ { marginBottom: '5em' } } fluid>
      <br />
      <Row>
        <Col sm={ 12 }>
          {breadcrumb}
        </Col>
      </Row>

      <Container fluid={ true }>
        <div className="d-flex flex-column">
          <ButtonGroup size="sm" className="mt-12">
            {toggleButton('Transcripts', isTranscriptsShown, toggleTranscripts)}
            {toggleButton('Program Script', isProgramScriptShown, toggleProgramScript)}
          </ButtonGroup>
        </div>

        <Row>
          {transcriptsColumn(TranscriptEl)}
          {programmeScriptColumn(ProgrammeScriptEl)}
        </Row>
      </Container>
    </Container>
  );
};

PaperEditor.propTypes = {
  match: PropTypes.any,
  videoHeight: PropTypes.any,
  firebase: PropTypes.any,
  labelsOptions: PropTypes.any
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(PaperEditor);
