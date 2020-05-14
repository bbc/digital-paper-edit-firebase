import React, { useState, useEffect, useReducer } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { anyInText } from '../../../Util/in-text';
import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';
import SearchBar from '@bbc/digital-paper-edit-storybook/SearchBar';

import SimpleCard from '@bbc/digital-paper-edit-storybook/SimpleCard';
import TranscriptCard from '@bbc/digital-paper-edit-storybook/TranscriptCard';
import cuid from 'cuid';

const initialFormState = {
  title: '',
  description: '',
  id: null
};

const formReducer = (state = initialFormState, { type, payload }) => {
  switch (type) {
  case 'update':
    return { ...state, ...payload };
  case 'reset': {
    return { initialFormState };
  }
  default:
    return state;
  }
};

const ItemsContainer = props => {
  const type = props.type;
  const [ showingItems, setShowingItems ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);

  // modal

  const handleSaveForm = item => {
    props.handleSave(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const handleEditItem = id => {
    const item = props.items.find(i => i.id === id);
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
    const results = props.items.map(item => handleFilterDisplay(item, text));
    setShowingItems(results.filter(item => item.display));
  };

  // generic

  const handleDeleteItem = id => {
    props.handleDelete(id);
  };

  useEffect(() => {
    setShowingItems(props.items);

    return () => {
      setShowingItems([]);
    };
  }, [ props.items ]);

  const Cards = showingItems.map(item => {
    const key = 'card-' + cuid();
    if (type === 'Transcript') {
      return (
        <TranscriptCard
          description={ item.description }
          message={ item.message }
          id={ item.id }
          status={ item.status }
          title={ item.title }
          url={ item.url ? item.url : '' }
          progress={ props.uploadTasks.get(item.id) }
          key={ key }
          handleEditItem={ handleEditItem }
          handleDeleteItem={ handleDeleteItem }
        />
      );
    } else {
      return (
        <SimpleCard
          id={ item.id }
          title={ item.title }
          url={ item.url }
          description={ item.description }
          key={ key }
          handleEditItem={ handleEditItem }
          handleDeleteItem={ handleDeleteItem }
        />
      );
    }
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

ItemsContainer.propTypes = {
  handleSave: PropTypes.any,
  handleDelete: PropTypes.any,
  items: PropTypes.array.isRequired,
  type: PropTypes.string,
  uploadTasks: PropTypes.any
};

ItemsContainer.defaultProps = {
  type: 'Project'
};

export default React.memo(ItemsContainer);
