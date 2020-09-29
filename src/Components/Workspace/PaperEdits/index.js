import React, { useEffect, useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { withAuthorization } from '../../Session';
import { itemsReducer, itemsInitState, itemsInit } from '../itemsReducer';
import { formReducer, initialFormState } from '../formReducer';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { anyInText } from '../../../Util/in-text';
import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';
import SearchBar from '@bbc/digital-paper-edit-storybook/SearchBar';

import SimpleCard from '@bbc/digital-paper-edit-storybook/SimpleCard';
import cuid from 'cuid';

const PaperEdits = (props) => {

  const [ showingItems, setShowingItems ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);

  const type = 'Paper Edit';
  const projectId = props.projectId;
  const collections = props.collections;

  const [ items, dispatchItems ] = useReducer(
    itemsReducer,
    itemsInitState,
    itemsInit
  );

  useEffect(() => {
    if (collections) {
      dispatchItems({
        type: 'set',
        payload: collections.getProjectPaperEdits(projectId),
      });
    }

    return () => {};
  }, [ collections, projectId ]);

  const genUrl = (id) => {
    return `/projects/${ projectId }/paperedits/${ id }/correct`;
  };

  const createPaperEdit = async (newItem) => {
    const item = { ...newItem, url: '', projectId: projectId };

    const newPaperEdit = await collections.createPaperEdit(
      projectId,
      newItem
    );

    item.id = newPaperEdit.id;
    item.url = genUrl(newPaperEdit.id);

    dispatchItems({ type: 'add', payload: { item: item } });
    await collections.updatePaperEdit(projectId, item.id, item);

    return item;
  };

  const updatePaperEdit = (id, item) => {
    collections.updatePaperEdit(projectId, id, item);
    dispatchItems({
      type: 'update',
      payload: { id, update: item },
    });
  };

  const handleSave = async (item) => {
    item.display = true;

    if (item.id) {
      updatePaperEdit(item.id, item);
    } else {
      createPaperEdit(item);
    }
  };

  const deletePaperEdit = async (id) => {
    await collections.deletePaperEdit(projectId, id);
    dispatchItems({ type: 'delete', payload: { id } });
  };

  const handleSaveForm = item => {
    handleSave(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const handleEditItem = id => {
    const item = items.find(i => i.id === id);
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

  // search

  const handleFilterDisplay = (item, text) => {
    if (anyInText([ item.title, item.description ], text)) {
      item.display = true;
    } else {
      item.display = false;
    }

    return item;
  };

  const handleSearch = text => {
    const results = items.map(item => handleFilterDisplay(item, text));
    setShowingItems(results.filter(item => item.display));
  };

  // generic

  useEffect(() => {
    setShowingItems(items);

    return () => {
      setShowingItems([]);
    };
  }, [ items ]);

  const Cards = showingItems.map(item => {
    const key = 'card-' + cuid();

    return (
      <SimpleCard
        id={ item.id }
        title={ item.title }
        url={ item.url }
        description={ item.description }
        key={ key }
        handleEditItem={ handleEditItem }
        handleDeleteItem={ deletePaperEdit }
      />
    );
  });

  return (
    <>
      <Row>
        <Col sm={ 9 }>
          <SearchBar handleSearch={ handleSearch } />
        </Col>
        <Col xs={ 12 } sm={ 3 }>
          <Button
            onClick={ toggleShowModal }
            variant="outline-secondary"
            size="sm"
            block
          >
            New {type}
          </Button>
        </Col>
      </Row>

      <section style={ { height: '75vh', overflow: 'scroll' } }>
        {showingItems.length > 0 ? (
          Cards
        ) : (
          <i>There are no {type}s, create a new one to get started.</i>
        )}
      </section>

      <FormModal
        { ...formData }
        modalTitle={ formData.id ? `Edit ${ type }` : `New ${ type }` }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
        type={ type }
      />
    </>
  );
};

PaperEdits.propTypes = {
  firebase: PropTypes.any,
  projectId: PropTypes.any
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(PaperEdits);
