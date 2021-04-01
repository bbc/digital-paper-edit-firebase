import PropTypes from 'prop-types';
import React, { useState, useEffect, useReducer } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CustomFooter from '../lib/CustomFooter';
import ItemsContainer from '../lib/ItemsContainer';
import Collection from '../Firebase/Collection';
import { withAuthorization } from '../Session';
import { PROJECTS } from '../../constants/routes';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'react-bootstrap/Button';

import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';

import { initialFormState, formReducer, createOrUpdateItem } from '../../Util/formReducer';

const Projects = (props) => {
  const [ uid, setUid ] = useState();
  const [ email, setEmail ] = useState();
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);
  const [ modalTitle, setModalTitle ] = useState('');

  const type = 'Project';
  const projectsCollection = new Collection(props.firebase, PROJECTS);
  const usersCollection = new Collection(props.firebase, '/users');

  const createLabel = async (projectId, label) => {
    const labelsCollection = new Collection(
      props.firebase,
      `/projects/${ projectId }/labels`
    );
    const labelDocRef = await labelsCollection.postItem(label);

    labelDocRef.update({
      id: labelDocRef.id,
    });
  };

  const createProject = async (item) => {
    const docRef = await projectsCollection.postItem(item);
    docRef.update({
      url: `/projects/${ docRef.id }`,
    });

    const defaultLabel = {
      label: 'Default',
      color: 'yellow',
      value: 'yellow',
      description: '',
    };
    createLabel(docRef.id, defaultLabel);
  };

  const updateProject = (id, item) => {
    projectsCollection.putItem(id, item);
  };

  const createOrUpdateProject = async (item) => {
    const updatedItem = { ...item };
    updatedItem.display = true;
    const paperEdit = await createOrUpdateItem(updatedItem, createProject, updateProject);

    return paperEdit;
  };

  const handleSaveForm = (item) => {
    createOrUpdateProject(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const handleSave = (item) => {
    item.display = true;

    if (item.id) {
      updateProject(item.id, item);
    } else {
      item.users = [ uid ];
      item.url = '';
      createProject(item);
      setItems(() => [ ...items, item ]);
    }
    props.trackEvent({ category: 'project', action: 'handleSave' });
  };

  const deleteProject = async (id) => {
    try {
      await projectsCollection.deleteItem(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id) => {
    deleteProject(id);
    props.trackEvent({ category: 'project', action: 'handleDelete' });
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
    const getUserProjects = async () => {
      setIsLoading(true);
      try {
        projectsCollection.userRef(uid).onSnapshot((snapshot) => {
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
  }, [ projectsCollection, items, loading, props.firebase, uid ]);

  useEffect(() => {
    const updateUser = (item) => {
      usersCollection.putItem(uid, item);
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
  }, [ usersCollection, items, props.firebase, uid, email ]);

  const toggleShowModal = () => {
    setShowModal(!showModal);
  };

  const handleOnHide = () => {
    setShowModal(false);
  };

  return (
    <>
      <Container
        data-testid="projectsContainer"
        style={ { marginBottom: '5em', marginTop: '1em' } }
      >
        <Row>
          <Col sm={ 2 }>
            <Button
              onClick={ toggleShowModal }
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
          <Col>
            <h2>Projects</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            {items ? (
              <ItemsContainer
                key={ type }
                model={ type }
                items={ items }
                handleSave={ handleSave }
                handleDelete={ handleDelete }
                handleEdit={ handleEdit }
              />
            ) : null}
          </Col>
        </Row>
      </Container>
      <CustomFooter />
      <FormModal
        { ...formData }
        modalTitle={ modalTitle }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
        type={ type }
      />
    </>
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
