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

  const [ projectTitle, setProjectTitle ] = useState('');
  const [ paperEditTitle, setPaperEditTitle ] = useState('');

  const [ fetchTranscripts, setFetchTranscripts ] = useState(false);
  const [ fetchProject, setFetchProject ] = useState(false);
  const [ fetchPaperEdit, setFetchPaperEdit ] = useState(false);

  const [ transcripts, setTranscripts ] = useState();

  const [ isTranscriptsShown, setIsTranscriptsShown ] = useState(true);
  const [ isProgramScriptShown, setIsProgramScriptShown ] = useState(true);

  useEffect(() => {
    const Projects = new Collection(props.firebase, 'projects');
    const getProject = async () => {
      setFetchProject(true);
      try {
        const project = await Projects.getItem(projectId);
        setProjectTitle(project.title);
      } catch (e) {
        console.error('Could not get Project Id: ', projectId, e);
      }
    };

    if (!projectTitle && !fetchProject) {
      getProject();
    }

    return () => {};
  }, [ projectTitle, projectId, fetchProject, props.firebase ]);

  useEffect(() => {
    const PaperEdits = new Collection(
      props.firebase,
      `/projects/${ projectId }/paperedits`
    );
    const getPaperEdit = async () => {
      setFetchPaperEdit(true);
      try {
        const paperEdit = await PaperEdits.getItem(papereditId);
        setPaperEditTitle(paperEdit.title);
      } catch (e) {
        console.error('Could not get PaperEdit Id: ', papereditId, e);
      }
    };

    if (!paperEditTitle && !fetchPaperEdit) {
      getPaperEdit();
    }

    return () => {};
  }, [ papereditId, fetchPaperEdit, paperEditTitle, props.firebase, projectId ]);

  useEffect(() => {
    const Transcriptions = new Collection(
      props.firebase,
      `/projects/${ projectId }/transcripts`
    );

    const getTranscripts = async () => {
      setFetchTranscripts(true);
      try {
        Transcriptions.collectionRef.onSnapshot((snapshot) => {
          setTranscripts(
            snapshot.docs.map((doc) => {
              return { ...doc.data(), id: doc.id, display: true };
            })
          );
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (!transcripts && !fetchTranscripts) {
      getTranscripts();
    }

    return () => {};
  }, [ transcripts, fetchTranscripts, props.firebase, projectId ]);

  const toggleTranscripts = () => {
    if (isProgramScriptShown) {
      setIsTranscriptsShown(!isTranscriptsShown);
    }
    const hideOrShow = isTranscriptsShown ? 'hide' : 'show';
    props.trackEvent({ category: 'programme script', action: 'click', name: `${ hideOrShow } transcript panel` });
  };

  const toggleProgramScript = () => {
    if (isTranscriptsShown) {
      setIsProgramScriptShown(!isProgramScriptShown);
    }
    const hideOrShow = isProgramScriptShown ? 'hide' : 'show';
    props.trackEvent({ category: 'programme script', action: 'click', name: `${ hideOrShow } programme script panel` });
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

    const Icon = <FontAwesomeIcon icon={ icon } />;

    return (
      <Button onClick={ toggle } variant={ variant }>
        {text} {Icon} {actionText}
      </Button>
    );
  };

  const breadcrumb = (
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
          name: 'PaperEdits',
        },
        {
          name: `${ paperEditTitle }`,
        },
      ] }
      handleClick={ () => props.trackEvent({ category: 'programme script/transcript editor', action: 'breadcrumb', name: 'go to project overview' }) }
    />
  );

  let TranscriptEl = (
    <>
      <br />
      <br />
      <i>No Transcripts, create a transcript to get started</i>
    </>
  );

  if (transcripts) {
    TranscriptEl = (
      <TranscriptsContainer
        projectId={ projectId }
        transcripts={ transcripts }
        firebase={ props.firebase }
      />
    );
  }

  let ProgrammeScriptEl = null;
  ProgrammeScriptEl = (
    <ProgrammeScriptContainer
      projectId={ projectId }
      projectTitle={ projectTitle }
      papereditId={ papereditId }
      videoHeight={ videoHeight }
    />
  );

  const transcriptsColumn = (el) => {
    if (isProgramScriptShown) {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span: 7, offset: 0 } }
          md={ { span: 7, offset: 0 } }
          lg={ { span: 7, offset: 0 } }
          xl={ { span: 7, offset: 0 } }
          style={ { display: 'block' } }
        >
          {el}
        </Col>
      );
    } else {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span: 12, offset: 0 } }
          md={ { span: 12, offset: 0 } }
          lg={ { span: 10, offset: 1 } }
          xl={ { span: 10, offset: 1 } }
          style={ { display: 'block', margin: '0 auto' } }
        >
          {el}
        </Col>
      );
    }
  };

  const programmeScriptColumn = (el) => {
    if (isTranscriptsShown) {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span: 5, offset: 0 } }
          md={ { span: 5, offset: 0 } }
          lg={ { span: 5, offset: 0 } }
          xl={ { span: 5, offset: 0 } }
          style={ { display: 'block' } }
        >
          {el}
        </Col>
      );
    } else {
      return (
        <Col
          xs={ { span: 12, offset: 0 } }
          sm={ { span: 12, offset: 0 } }
          md={ { span: 12, offset: 0 } }
          lg={ { span: 10, offset: 1 } }
          xl={ { span: 8, offset: 2 } }
          style={ { display: 'block', margin: '0 auto' } }
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
        <Col sm={ 12 }>{breadcrumb}</Col>
      </Row>

      <Container fluid={ true }>
        <div className="d-flex flex-column">
          <ButtonGroup size="sm" className="mt-12">
            {toggleButton('Transcripts', isTranscriptsShown, toggleTranscripts)}
            {toggleButton(
              'Program Script',
              isProgramScriptShown,
              toggleProgramScript
            )}
          </ButtonGroup>
        </div>

        <Row>
          { isTranscriptsShown && transcriptsColumn(TranscriptEl) }
          { isProgramScriptShown && programmeScriptColumn(ProgrammeScriptEl) }
        </Row>
      </Container>
    </Container>
  );
};

PaperEditor.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.any,
  trackEvent: PropTypes.func,
  videoHeight: PropTypes.any
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(PaperEditor);
