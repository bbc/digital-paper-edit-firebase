import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Breadcrumb from '@bbc/digital-paper-edit-storybook/Breadcrumb';
import CustomFooter from '../lib/CustomFooter';
import ItemsContainer from '../lib/ItemsContainer';
import { withAuthorization } from '../Session';
import { updateItems, deleteItem, addItem } from '../../Util/items';

const Projects = (props) => {
  const collections = props.collections;
  const [ items, setItems ] = useState();

  useEffect(() => {
    if (collections) {
      setItems(collections.userProjects);
    }

    return () => {};
  }, [ collections ]);

  const type = 'Project';

  const handleSave = (item) => {
    item.display = true;

    if (item.id) {
      collections.updateProject(item.id, item);
      setItems(() => updateItems(item.id, items, item));
    } else {
      collections.createProject(item);
      setItems(() => addItem(items, item));
    }
  };

  const handleDelete = (id) => {
    collections.deleteProject(id);
    setItems(() => deleteItem(id, items));
  };

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
  collections: PropTypes.shape({
    createProject: PropTypes.func,
    deleteProject: PropTypes.func,
    updateProject: PropTypes.func,
    userProjects: PropTypes.any,
  }),
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Projects);
