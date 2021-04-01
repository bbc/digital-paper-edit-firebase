import PropTypes from 'prop-types';
import React, { useState, useEffect, useReducer } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CustomFooter from '../lib/CustomFooter';
// import Transcripts from './Transcripts';
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
import { createCollectionItem, createOrUpdateItem, deleteCollectionItem, formReducer, initialFormState, updateCollectionItem, updateItems } from '../../Util/formReducer';

const WorkspaceView = props => {
  const projects = new Collection(props.firebase, PROJECTS);

  const id = props.match.params.projectId;
  const [ title, setTitle ] = useState('Project Title');
  const [ uid, setUid ] = useState();

  const firebase = props.firebase;
  const [ loading, setIsLoading ] = useState(false);

  const [ modalTitle, setModalTitle ] = useState('');
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);

  const [ paperEditItems, setPaperEditItems ] = useState([]);
  const [ loadingPE, setIsloadingPE ] = useState(false);

  const PaperEditsCollection = new Collection(
    props.firebase,
    `/projects/${ id }/paperedits`
  );

  const TranscriptsCollection = new Collection(
    props.firebase,
    `/projects/${ id }/transcripts`
  );

  const [ transcriptItems, setTranscriptItems ] = useState([]);

  console.log(setModalTitle, uid, transcriptItems);

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
    const getProjectName = async () => {
      try {
        const doc = await projects.getItem(id);
        setTitle(doc.title);
      } catch (e) {
        console.error('Could not get Project Id: ', id, e);
      }
    };

    getProjectName();

    return () => {};
  }, [ id, projects ]);

  // modal

  const createPaperEdit = async (item) => {
    const newItem = await createCollectionItem(item, PaperEditsCollection);
    setPaperEditItems(() => [ newItem, ...paperEditItems ]);
  };

  const deletePaperEdit = async (item) => {
    await deleteCollectionItem(item.id, PaperEditsCollection);
    setPaperEditItems(() => paperEditItems.filter(i => i.id !== item.id));
  };

  const updatePaperEdit = (item) => {
    updateCollectionItem(item, paperEditItems);
    setPaperEditItems(updateItems(item, paperEditItems));
  };

  const handleEditItem = (itemId, items, type) => {
    setModalTitle(formData.id ? `Edit ${ type }` : `New ${ type }`);
    const item = items.find(i => i.id === itemId);
    dispatchForm({
      type: 'update',
      payload: item
    });
    setShowModal(true);
  };

  const toggleShowModal = () => {
    setShowModal(!showModal);
  };

  const handleOnHide = () => {
    setShowModal(false);
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

    if (!loading) {
      getTranscripts();
      setIsLoading(true);
    }

  }, [ TranscriptsCollection.collectionRef, loading ]);

  // general

  const createOrUpdateCollectionItem = async (item, create, update) => {
    const updatedItem = { ...item };
    updatedItem.display = true;

    if (!updatedItem.id) {
      updatedItem.url = '';
      updatedItem.projectId = id;
    }
    updatedItem = await createOrUpdateItem(item, create, update);

    return updatedItem;
  };

  const createOrUpdatePaperEdit = async (item) => {
    const paperEdit = await createOrUpdateCollectionItem(item, createPaperEdit, updatePaperEdit);

    return paperEdit;
  };

  const handleSaveForm = (item) => {
  // const handleSaveForm = (item) => {
    // createOrUpdateFn(formData);
    createOrUpdatePaperEdit(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const handleDeleteItem = (item, deleteFn) => {
    deleteFn(item);
  };

  const handleDuplicateItem = (item, updateFn) => {
    const clone = { ...item };
    updateFn(clone);
  };

  useEffect(() => {
    const getPaperEdits = async () => {
      try {
        PaperEditsCollection.collectionRef.onSnapshot((snapshot) => {
          const paperEdits = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setPaperEditItems(paperEdits);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };
    // TODO: some error handling
    if (!loadingPE) {
      getPaperEdits();
      setIsloadingPE(true);
    }

    return () => {};
  }, [ PaperEditsCollection, loadingPE, paperEditItems, id ]);

  return (
    <Container style={ { marginBottom: '5em' } }>
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
            onClick={ toggleShowModal }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> New Programme Script
          </Button>
        </Col>
        <Col sm={ 3 }>
          <Button
            onClick={ toggleShowModal }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> Convert Media to Transcript
          </Button>
        </Col>
      </Row>
      <hr></hr>
      <Row style={ { marginBottom: '15px' } }>
        <Col>
          <h2>&quot;{title}&quot;</h2>
        </Col>
      </Row>
      <Row>
        <Col sm={ 8 }>

        </Col>
      </Row>
      <Row>
        <Col>
          {paperEditItems ? (
            <PaperEdits
              items={ paperEditItems }
              handleEditItem={ (item) => handleEditItem(item, createOrUpdatePaperEdit, 'paper-edit') }
              handleDeleteItem={ (item) => handleDeleteItem(item, deletePaperEdit) }
              handleDuplicateItem={ (item) => handleDuplicateItem(item, updatePaperEdit) }
            />
          ) : null}
        </Col>
      </Row>
      <CustomFooter />
      <FormModal
        { ...formData }
        modalTitle={ modalTitle }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
        type={ 'paper-edit' }
        // type={ type }
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
