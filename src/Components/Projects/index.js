import PropTypes from 'prop-types';
import React, { useState, useEffect, useReducer } from 'react';
import CustomFooter from '../lib/CustomFooter';
import Collection from '../Firebase/Collection';
import { withAuthorization } from '../Session';
import { PROJECTS } from '../../constants/routes';
import { formReducer, incrementCopyName, initialFormState, } from '../../Util/form';
import { createCollectionItem, createOrUpdateCollectionItem,
  deleteCollectionItem, handleDeleteItem, handleDuplicateItem,
  updateCollectionItem, updateItems } from '../../Util/collection';
import { formatDates } from '../../Util/time';

import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';
import ProjectRow from '@bbc/digital-paper-edit-storybook/ProjectRow';

const Projects = (props) => {
  const [ uid, setUid ] = useState();
  const [ email, setEmail ] = useState();
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);
  const [ modalTitle, setModalTitle ] = useState('');

  const type = 'Project';
  const ProjectsCollection = new Collection(props.firebase, PROJECTS);

  const createDefaultLabel = async (projectId) => {
    const defaultLabel = {
      label: 'Default',
      color: 'yellow',
      value: 'yellow',
      description: '',
    };
    const labelsCollection = new Collection(
      props.firebase,
      `/projects/${ projectId }/labels`
    );
    const labelDocRef = await labelsCollection.postItem(defaultLabel);

    labelDocRef.update({
      id: labelDocRef.id,
    });
  };

  const createProject = async (item) => {
    const newItem = await createCollectionItem(item, ProjectsCollection);
    await createDefaultLabel(newItem.id);
    setItems(() => [ newItem, ...items ]);
    props.trackEvent({ category: 'projects', action: `createProject ${ item.id }` });

    return newItem;
  };

  const updateProject = async (item) => {
    const newItem = items.find(i => i.id === item.id);
    newItem = { ...newItem, ...item };
    await updateCollectionItem(newItem, ProjectsCollection);
    setItems(updateItems(newItem, items));
    props.trackEvent({ category: 'projects', action: `updateProject ${ item.id }` });

    return newItem;
  };

  const createOrUpdateProject = async (item) => {
    let newProject = { ...item };
    delete newProject.display;

    if (!newProject.id) {
      newProject = { ...newProject, users: [ uid ] };
    }
    newProject = await createOrUpdateCollectionItem(newProject, createProject, updateProject);
    newProject.display = true;

    return newProject;
  };

  const duplicateProject = async (item) => {
    let newItem = { ...items.find(i => i.id === item.id) };
    newItem.title = incrementCopyName(newItem.title, items.map(p => p.title));
    newItem = await createCollectionItem(newItem, ProjectsCollection);
    setItems(() => [ newItem, ...items ]);
    props.trackEvent({ category: 'projects', action: `duplicateProject ${ item.id }` });
  };

  const handleSaveForm = (item) => {
    createOrUpdateProject(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const deleteProject = async (item) => {
    await deleteCollectionItem(item.id, ProjectsCollection);
    setItems(() => items.filter(i => i.id !== item.id));
    props.trackEvent({ category: 'projects', action: `deleteProject ${ item.id }` });
  };

  const handleEdit = (itemId) => {
    setModalTitle(formData.id ? `Edit ${ type }` : `New ${ type }`);
    const item = items.find(i => i.id === itemId);
    dispatchForm({
      type: 'update',
      payload: item
    });
    setShowModal(true);
  };

  useEffect(() => {
    const collection = new Collection(props.firebase, PROJECTS);
    const getUserProjects = async () => {
      setIsLoading(true);
      try {
        collection.userRef(uid).onSnapshot((snapshot) => {
          const projects = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setItems(projects);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    const authListener = props.firebase.onAuthUserListener(
      (authUser) => {
        if (authUser) {
          setUid(authUser.uid);
          setEmail(authUser.email);
        }
      },
      () => setUid()
    );

    if (uid && !loading) {
      getUserProjects(uid);
    }

    return () => {
      authListener();
    };
  }, [ items, loading, props.firebase, uid ]);

  useEffect(() => {
    const collection = new Collection(props.firebase, '/users');
    const updateUser = (item) => {
      collection.putItem(uid, item);
    };

    const updateUserProjects = async () => {
      const item = {
        'projects': items.map((project) => project.id),
        'email': email
      };
      updateUser(item);
    };

    if (uid && items.length > 0) {
      updateUserProjects();
    }

    return () => {};
  }, [ items, props.firebase, uid, email ]);

  const handleOnHide = () => {
    setShowModal(false);
  };

  const ProjectRows = items.map(item => {
    const key = `card-project-${ item.id }`;
    const { created, updated } = formatDates(item);

    return (
      <div key={ key }>
        <ProjectRow
          description={ item.description }
          id={ item.id }
          title={ item.title }
          url={ item.url ? item.url : '' }
          created={ created ? created : 'NA' }
          updated={ updated ? updated : 'NA' }
          handleDuplicateItem={ (itemId) => handleDuplicateItem({ id: itemId }, duplicateProject) }
          handleEditItem={ (itemId) => handleEdit(itemId) }
          handleDeleteItem={ (itemId) => handleDeleteItem({ id: itemId }, deleteProject) }
        />
        <hr style={ { color: 'grey' } } />
      </div>
    );
  });

  return (
    <Container>
      <Row>
        <Col sm={ 2 }>
          <Button
            onClick={ handleEdit }
            variant="outline-secondary"
            size="sm"
            block
          >
            <FontAwesomeIcon icon={ faCircle } /> New Project
          </Button>
        </Col>
      </Row>
      <hr></hr>
      <Row style={ { marginBottom: '15px' } }>
        <Col sm={ 6 }><h5>Projects</h5></Col>
        <Col sm={ 4 }><h5>Created / Updated</h5></Col>
      </Row>
      <Row>
        <Col>
          {items.length > 0 ? (
            ProjectRows
          ) : <i>There are no projects, create a new one to get started.</i>}
        </Col>
      </Row>
      <CustomFooter />
      <FormModal
        title={ formData.title }
        description={ formData.description ? formData.description : initialFormState.description }
        id={ formData.id ? formData.id : initialFormState.id }
        modalTitle={ modalTitle }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
        type={ type }
      />
    </Container>
  );
};

Projects.propTypes = {
  firebase: PropTypes.shape({
    onAuthUserListener: PropTypes.func,
  }),
  trackEvent: PropTypes.func
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Projects);
