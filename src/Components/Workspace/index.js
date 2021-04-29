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

  // modal

  const createPaperEdit = async (item) => {
    const newItem = await createCollectionItem(item, PaperEditsCollection);
    setPaperEditItems(() => [ newItem, ...paperEditItems ]);
    props.trackEvent({ category: 'paperEdits', action: `createPaperEdit ${ newItem.id }` });

    return newItem;
  };

  const deletePaperEdit = async (item) => {
    await deleteCollectionItem(item.id, PaperEditsCollection);
    setPaperEditItems(() => paperEditItems.filter(i => i.id !== item.id));
    props.trackEvent({ category: 'paperEdits', action: `deletePaperEdit ${ item.id }` });
  };

  const duplicatePaperEdit = async (item) => {
    let newItem = { ...paperEditItems.find(i => i.id === item.id) };
    newItem.title = incrementCopyName(newItem.title, paperEditItems.map(p => p.title));
    newItem = await createCollectionItem(newItem, PaperEditsCollection);
    setPaperEditItems(() => [ newItem, ...paperEditItems ]);
    props.trackEvent({ category: 'paperEdits', action: `duplicatePaperEdit ${ item.id }` });
  };

  const updatePaperEdit = async (item) => {
    let newItem = paperEditItems.find(i => i.id === item.id);
    newItem = { ...newItem, ...item };
    newItem = await updateCollectionItem(newItem, PaperEditsCollection);
    setPaperEditItems(updateItems(newItem, paperEditItems));
    props.trackEvent({ category: 'paperEdits', action: `updatePaperEdit ${ item.id }` });

    return newItem;
  };

  const updateTranscript = async (item) => {
    let newItem = transcriptItems.find(i => i.id === item.id);
    newItem = { ...newItem, ...item };
    await updateCollectionItem(newItem, TranscriptsCollection);
    setTranscriptItems(updateItems(newItem, transcriptItems));
    props.trackEvent({ category: 'transcripts', action: `updateTranscript ${ item.id }` });

    return newItem;
  };

  const createTranscript = async (item) => {
    const newItem = await createCollectionItem(item, TranscriptsCollection);
    setTranscriptItems(() => [ newItem, ...transcriptItems ]);
    props.trackEvent({ category: 'transcripts', action: `createTranscript ${ item.id }` });

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
    props.trackEvent({ category: 'transcripts', action: `deleteTranscript ${ item.id }` });
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
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(taskId);
    setUploadTasks(newTasks);

    updateTranscript({ id: taskId, status: 'error' });
  };

  const handleUploadComplete = (taskId) => {
    console.log('File upload completed');
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(taskId);
    setUploadTasks(newTasks);

    updateTranscript({ id: taskId, status: 'in-progress' });
  };

  const getUploadPath = (taskId) => {
    return `users/${ uid }/${ UPLOADFOLDER }/${ taskId }`;
  };

  const asyncUploadFile = async (taskId, file) => {
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
          handleUploadComplete(taskId);
        }
      );
    };
    video.src = URL.createObjectURL(file);
  };

  const handleEditPaperEdit = (itemId) => {
    setModalPETitle(formPEData.id ? 'Edit Paper Edit' : 'New Paper Edit');
    const item = paperEditItems.find(i => i.id === itemId);
    dispatchPEForm({
      type: 'update',
      payload: item
    });
    setShowPEModal(true);
    setShowTModal(false);
  };

  const handleEditTranscript = (itemId) => {
    setModalTTitle(formTData.id ? 'Edit Transcript' : 'New Transcript');
    const item = transcriptItems.find(i => i.id === itemId);
    dispatchTForm({
      type: 'update',
      payload: item
    });
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
    delete newTranscript.display;

    if (newTranscript.id) {
      newTranscript = await createOrUpdateCollectionItem(newTranscript, createTranscript,
        updateTranscript);

    } else {
      const file = newTranscript.file;
      delete newTranscript.file;

      newTranscript = await createOrUpdateCollectionItem({
        ...newTranscript,
        title: newTranscript.title,
        projectId: id,
        description: newTranscript.description ? newTranscript.description : '',
        status: 'uploading',
      }, createTranscript, updateTranscript);

      asyncUploadFile(newTranscript.id, file);
    }

    newTranscript.display = true;

    return newTranscript;
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

  return (
    <Container >
      <Row>
        <Col sm={ 2 }>
          <a href="#">
            <Button size="sm">
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
            onClick={ handleEditTranscript }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> Transcribe Media
          </Button>
        </Col>
      </Row>
      <hr></hr>
      <Row style={ { marginBottom: '15px' } }>
        <Col>
          <h2>Project: &quot;{title}&quot;</h2>
        </Col>
      </Row>
      <Row>
        <Col sm={ 4 }><h5>Title</h5></Col>
        <Col sm={ 4 }><h5>Created / Updated</h5></Col>
        <Col sm={ 4 }><h5>Transcripts</h5></Col>
      </Row>
      <Row>
        <Col sm={ 8 }>
          {paperEditItems ? (
            <PaperEdits
              items={ paperEditItems }
              handleEditItem={ (itemId) => handleEditPaperEdit(itemId) }
              handleDeleteItem={ (itemId) => handleDeleteItem({ id: itemId }, deletePaperEdit) }
              handleDuplicateItem={ (itemId) => handleDuplicateItem({ id: itemId }, duplicatePaperEdit) }
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
        type={ 'paper-edit' }
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
