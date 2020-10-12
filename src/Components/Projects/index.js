import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';
import CustomFooter from '../lib/CustomFooter';
import ItemsContainer from '../lib/ItemsContainer';
import Collection from '../Firebase/Collection';
import { withAuthorization } from '../Session';
import { PROJECTS } from '../../constants/routes';

const Projects = (props) => {
  const [ uid, setUid ] = useState();
  const [ email, setEmail ] = useState();
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);

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

  const breadcrumbItems = [
    {
      name: `${ type }s`,
      link: `/${ type }s`,
    },
  ];

  return (
    <>
      <Container
        data-testid="projectsContainer"
        style={ { marginBottom: '5em', marginTop: '1em' } }
      >
        <Row>
          <Col sm={ 12 }>
            <Breadcrumb
              data-testid="projectsBreadcrumb"
              items={ breadcrumbItems }
            />
          </Col>
        </Row>
        {items ? (
          <ItemsContainer
            key={ type }
            model={ type }
            items={ items }
            handleSave={ handleSave }
            handleDelete={ handleDelete }
          />
        ) : null}
      </Container>
      <CustomFooter />
    </>
  );
};

Projects.propTypes = {
  firebase: PropTypes.shape({
    onAuthUserListener: PropTypes.func,
  }),
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Projects);
