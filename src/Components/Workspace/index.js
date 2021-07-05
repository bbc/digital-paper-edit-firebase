import PropTypes from 'prop-types';
import React, { useState, useEffect, useReducer } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CustomFooter from '../lib/CustomFooter';
import Transcripts from './Transcripts';
import PaperEdits from './PaperEdits';
import Button from 'react-bootstrap/Button';
import Collection from '../Firebase/Collection';
import { PROJECTS } from '../../constants/routes';
import { withAuthorization } from '../Session';
import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDuration } from '../../Util/time';
import './index.scss';

import {
  faArrowLeft,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import Container from 'react-bootstrap/Container';
import { formReducer, incrementCopyName, initialFormState, } from '../../Util/form';
import { createCollectionItem, createOrUpdateCollectionItem,
  deleteCollectionItem, handleDeleteItem, handleDuplicateItem,
  updateCollectionItem, updateItems } from '../../Util/collection';

const WorkspaceView = props => {
  const UPLOADFOLDER = 'uploads';
  const firebase = props.firebase;

  const id = props.match.params.projectId;
  const [ title, setTitle ] = useState('Project Title');
  const [ uid, setUid ] = useState();

  const [ transcriptItems, setTranscriptItems ] = useState([]);

  const [ loadingT, setIsLoadingT ] = useState(false);
  const [ modalTTitle, setModalTTitle ] = useState('');
  const [ showTModal, setShowTModal ] = useState(false);
  const [ formTData, dispatchTForm ] = useReducer(formReducer, initialFormState);

  const [ paperEditItems, setPaperEditItems ] = useState([]);

  const [ loadingPE, setIsloadingPE ] = useState(false);
  const [ modalPETitle, setModalPETitle ] = useState('');
  const [ showPEModal, setShowPEModal ] = useState(false);
  const [ formPEData, dispatchPEForm ] = useReducer(formReducer, initialFormState);

  const [ uploadTasks, setUploadTasks ] = useState(new Map());

  const PaperEditsCollection = new Collection(
    props.firebase,
    `/projects/${ id }/paperedits`
  );

  const TranscriptsCollection = new Collection(
    props.firebase,
    `/projects/${ id }/transcripts`
  );

  // search to move here
  useEffect(() => {
    const authListener = firebase.onAuthUserListener(
      (authUser) => {
        if (authUser) {
          setUid(authUser.uid);
        }
      },
      () => setUid()
    );

    return () => {
      authListener();
    };
  }, [ firebase ]);

  useEffect(() => {
    const collection = new Collection(props.firebase, PROJECTS);

    const getProjectName = async () => {
      try {
        const doc = await collection.getItem(id);
        setTitle(doc.title);
      } catch (e) {
        console.error('Could not get Project Id: ', id, e);
      }
    };

    getProjectName();

    return () => {};
  }, [ id, props.firebase ]);

  useEffect(() => {
    window.onbeforeunload = (event) => {
      event.preventDefault();
      if (uploadTasks.size !== 0) {
        event.returnValue = 'Your file has not finished uploading';
      }};

  }, [ uploadTasks ]);

  // modal

  const createPaperEdit = async (item) => {
    const newItem = await createCollectionItem(item, PaperEditsCollection);
    setPaperEditItems(() => [ newItem, ...paperEditItems ]);
    props.trackEvent({ category: 'project overview', action: 'create', name: `programme script: ${ newItem.id }` });

    return newItem;
  };

  const deletePaperEdit = async (item) => {
    await deleteCollectionItem(item.id, PaperEditsCollection);
    setPaperEditItems(() => paperEditItems.filter(i => i.id !== item.id));
    props.trackEvent({ category: 'project overview', action: 'delete', name: `programme script: ${ item.id }` });

  };

  const duplicatePaperEdit = async (item) => {
    let newItem = { ...paperEditItems.find(i => i.id === item.id) };
    newItem.title = incrementCopyName(newItem.title, paperEditItems.map(p => p.title));
    newItem = await createCollectionItem(newItem, PaperEditsCollection);
    setPaperEditItems(() => [ newItem, ...paperEditItems ]);
    props.trackEvent({ category: 'project overview', action: 'duplicate', name: `programme script: ${ item.id }` });
  };

  const updatePaperEdit = async (item) => {
    let newItem = paperEditItems.find(i => i.id === item.id);
    newItem = { ...newItem, ...item };
    newItem = await updateCollectionItem(newItem, PaperEditsCollection);
    setPaperEditItems(updateItems(newItem, paperEditItems));
    props.trackEvent({ category: 'project overview', action: 'update', name: `programme script: ${ item.id }` });

    return newItem;
  };

  const updateTranscript = async (item) => {
    let newItem = transcriptItems.find(i => i.id === item.id);
    newItem = { ...newItem, ...item };
    await updateCollectionItem(newItem, TranscriptsCollection);
    updateItems(newItem, transcriptItems);
    props.trackEvent({ category: 'project overview', action: 'update', name: `transcript: ${ item.id }` });

    return newItem;
  };

  const createTranscript = async (item) => {
    const newItem = await createCollectionItem(item, TranscriptsCollection);
    setTranscriptItems(() => [ newItem, ...transcriptItems ]);
    props.trackEvent({ category: 'project overview', action: 'create', name: `transcript: ${ newItem.id }` });

    return newItem;
  };

  const deleteTranscript = async (item) => {
    await deleteCollectionItem(item.id, TranscriptsCollection);
    setTranscriptItems(() => transcriptItems.filter(i => i.id !== item.id));

    try {
      await firebase.storage.child(`users/${ uid }/uploads/${ item.id }`).delete();
      await firebase.storage.child(`users/${ uid }/audio/${ item.id }`).delete();
    } catch (e) {
      console.error('Failed to delete item in storage: ', e.code_);
    }
    props.trackEvent({ category: 'project overview', action: 'delete', name: `transcript: ${ item.id }` });
  };

  // storage

  const updateUploadTasksProgress = (taskId, progress) => {
    const newUploading = new Map(uploadTasks); // shallow clone
    newUploading.set(taskId, progress);

    setUploadTasks(newUploading);
  };

  const handleUploadProgress = (taskId, snapshot) => {
    const progress = Math.floor(
      (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    );
    updateUploadTasksProgress(taskId, progress);
  };

  const handleUploadError = (taskId, error) => {
    console.error('Failed to upload file: ', error);
    const newTasks = new Map(uploadTasks);
    newTasks.delete(taskId);
    setUploadTasks(newTasks);

    updateTranscript({ id: taskId, status: 'error' });
  };

  const handleUploadComplete = (newTranscript) => {
    const { id: taskId } = newTranscript;
    console.log('File upload completed');
    const newTasks = new Map(uploadTasks);
    newTasks.delete(taskId);
    setUploadTasks(newTasks);

    updateTranscript({ ...newTranscript, status: 'in-progress' });
  };

  const getUploadPath = (taskId) => {
    return `users/${ uid }/${ UPLOADFOLDER }/${ taskId }`;
  };

  const asyncUploadFile = async (newTranscript, file) => {
    const { id: taskId } = newTranscript;
    const path = getUploadPath(taskId);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;

      const metadata = {
        customMetadata: {
          userId: uid,
          id: taskId,
          projectId: id,
          originalName: file.name,
          folder: UPLOADFOLDER,
          duration: duration,
        },
      };

      const uploadTask = firebase.storage.child(path).put(file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          handleUploadProgress(taskId, snapshot);
        },
        (error) => {
          handleUploadError(taskId, error);
        },
        () => {
          handleUploadComplete(newTranscript);
        }
      );
    };
    video.src = URL.createObjectURL(file);
  };

  const handleEditPaperEdit = (itemId) => {
    if (typeof(itemId) === 'string') {
      setModalPETitle('Edit Programme Script');
      const item = paperEditItems.find(i => i.id === itemId);
      dispatchPEForm({
        type: 'update',
        payload: item
      });
    } else {
      setModalPETitle('New Programme Script');
      dispatchPEForm({
        type: 'reset'
      });
    }
    setShowPEModal(true);
    setShowTModal(false);
  };

  const handleEditTranscript = (itemId) => {
    if (typeof (itemId) === 'string') {
      setModalTTitle('Edit Transcript');
      const item = transcriptItems.find(i => i.id === itemId);
      dispatchTForm({
        type: 'update',
        payload: item
      });
    } else {
      setModalTTitle('New Transcript');
      dispatchTForm({
        type: 'reset'
      });
    }
    setShowTModal(true);
    setShowPEModal(false);
  };

  const handleOnTHide = () => {
    setShowTModal(false);
  };

  const handleOnPEHide = () => {
    setShowPEModal(false);
  };

  useEffect(() => {
    const getTranscripts = async () => {
      try {
        TranscriptsCollection.collectionRef.onSnapshot((snapshot) => {
          const transcripts = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setTranscriptItems(transcripts);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (!loadingT) {
      getTranscripts();
      setIsLoadingT(true);
    }

  }, [ TranscriptsCollection.collectionRef, loadingT ]);

  // general

  const finishCreateOrUpdateTranscript = async (transcript, duration, video) => {
    video.remove();
    const file = transcript.file;
    delete transcript.file;

    const uploaded = new Date();

    const newTranscript = await createOrUpdateCollectionItem({
      ...transcript,
      title: transcript.title,
      projectId: id,
      description: transcript.description ? transcript.description : '',
      status: 'uploading',
      duration: duration,
      uploaded: uploaded
    }, createTranscript, updateTranscript);

    await asyncUploadFile(newTranscript, file);

    newTranscript.display = true;

    return newTranscript;

  };

  const createOrUpdateWithDuration = async (newTranscript) => {
    const file = newTranscript.file;
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      const formattedDuration = await formatDuration(duration);

      return await finishCreateOrUpdateTranscript(newTranscript, formattedDuration, video);
    };

    video.src = URL.createObjectURL(file);
  };

  const createOrUpdatePaperEdit = async (item) => {
    const newPaperEdit = { ...item, projectId: id };
    delete newPaperEdit.display;
    const paperEdit = await createOrUpdateCollectionItem(newPaperEdit,
      createPaperEdit, updatePaperEdit);
    paperEdit.display = true;

    return paperEdit;
  };

  const createOrUpdateTranscript = async (item) => {
    let newTranscript = { ...item, projectId: id };

    if (newTranscript.id) {
      newTranscript = await createOrUpdateCollectionItem(newTranscript, createTranscript,
        updateTranscript);

      newTranscript.display = true;

      return newTranscript;

    } else {
      return await createOrUpdateWithDuration(newTranscript);
    }
  };

  const handleSavePaperEditForm = (item) => {
    createOrUpdatePaperEdit(item);
    setShowPEModal(false);
    dispatchPEForm({ type: 'reset' });
  };

  const handleSaveTranscriptForm = (item) => {
    createOrUpdateTranscript(item);
    setShowTModal(false);
    dispatchTForm({ type: 'reset' });
  };

  useEffect(() => {
    const collection = new Collection(
      props.firebase,
      `/projects/${ id }/paperedits`
    );
    const getPaperEdits = async () => {
      try {
        collection.collectionRef.onSnapshot((snapshot) => {
          const paperEdits = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setPaperEditItems(paperEdits);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    if (!loadingPE) {
      getPaperEdits();
      setIsloadingPE(true);
    }

    return () => {};
  }, [ loadingPE, paperEditItems, id, props.firebase ]);

  const convertMediaButton = () => {
    handleEditTranscript();
    props.trackEvent({ category: 'project overview', action: 'click', name: 'convert media to transcript' });
  };

  return (
    <Container>
      <Row>
        <Col sm={ 6 }>
          <a href="#">
            <Button
              size="sm"
              onClick={ () => props.trackEvent({ category: 'project overview', action: 'click', name: 'back to projects' }) }>
              <FontAwesomeIcon icon={ faArrowLeft } /> Back to Projects
            </Button>
          </a>
        </Col>
        <Col sm={ 3 }>
          <Button
            onClick={ handleEditPaperEdit }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> New Programme Script
          </Button>
        </Col>
        <Col sm={ 3 }>
          <Button
            onClick={
              convertMediaButton
            }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> Convert Media to Transcript
          </Button>
        </Col>
      </Row>
      <hr></hr>
      <Row className="title-row">
        <Col>
          <h2>Project: &quot;{title}&quot;</h2>
        </Col>
      </Row>
      <Row className="headers-row">
        <Col className="column" sm={ 8 }>
          <h5 className="column__header">Programme scripts</h5>
          <h5 className="column__header">Created / Updated</h5>
        </Col>
        <Col><h5 className="column__header">Transcripts</h5></Col>
      </Row>
      <Row>
        <Col sm={ 8 }>
          {paperEditItems ? (
            <PaperEdits
              items={ paperEditItems }
              handleEditItem={ (itemId) => handleEditPaperEdit(itemId) }
              handleDeleteItem={ (itemId) => handleDeleteItem({ id: itemId }, deletePaperEdit) }
              handleDuplicateItem={ (itemId) => handleDuplicateItem({ id: itemId }, duplicatePaperEdit) }
              trackEvent ={ props.trackEvent }
            />
          ) : null}
        </Col>
        <Col sm={ 4 }>
          {transcriptItems ? (
            <Transcripts
              items={ transcriptItems }
              uploadTasks={ uploadTasks }
              handleEditItem={ (itemId) => handleEditTranscript(itemId) }
              handleDeleteItem={ (itemId) => handleDeleteItem({ id: itemId }, deleteTranscript) }
            />
          ) : null}
        </Col>
      </Row>
      <CustomFooter />
      <FormModal
        title={ formPEData.title }
        description={ formPEData.description ? formPEData.description : initialFormState.description }
        id={ formPEData.id ? formPEData.id : initialFormState.id }
        modalTitle={ modalPETitle }
        showModal={ showPEModal }
        handleOnHide={ handleOnPEHide }
        handleSaveForm={ handleSavePaperEditForm }
        type={ 'programme-script' }
      />
      <FormModal
        title={ formTData.title }
        description={ formTData.description ? formTData.description : initialFormState.description }
        id={ formTData.id ? formTData.id : initialFormState.id }
        modalTitle={ modalTTitle }
        showModal={ showTModal }
        handleOnHide={ handleOnTHide }
        handleSaveForm={ handleSaveTranscriptForm }
        type={ 'transcript' }
      />
    </Container>
  );
};

WorkspaceView.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  }),
  trackEvent: PropTypes.func
};
const condition = authUser => !!authUser;
export default withAuthorization(condition)(WorkspaceView);
