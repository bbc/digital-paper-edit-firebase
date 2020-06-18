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
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const type = 'Project';
  const collection = new Collection(props.firebase, PROJECTS);

  const createLabel = async (projectId, label) => {
    const LabelsCollection = new Collection(
      props.firebase,
      `/projects/${ projectId }/labels`
    );
    const labelDocRef = await LabelsCollection.postItem(label);

    labelDocRef.update({
      id: labelDocRef.id,
    });
  };

  const createProject = async (item) => {
    const docRef = await collection.postItem(item);
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
    collection.putItem(id, item);
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
      await collection.deleteItem(id);
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
  }, [ collection, items, loading, props.firebase, uid ]);

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
    onAuthUserListener: PropTypes.func
  })
};

// const condition = (authUser) => !!authUser;
const condition = (oidc, authUser) => !!(oidc && authUser);
export default withAuthorization(condition)(Projects);
