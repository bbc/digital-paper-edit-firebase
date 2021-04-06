import React, { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';

import { getISOTime } from '../../../Util/time';

import ProjectRow from '@bbc/digital-paper-edit-storybook/ProjectRow';
import TranscriptRow from '@bbc/digital-paper-edit-storybook/TranscriptRow';
import cuid from 'cuid';

const ItemsContainer = props => {
  const type = props.type;
  const [ showingItems, setShowingItems ] = useState([]);

  const handleEditItem = id => {
    props.handleEdit(id);
  };

  const handleDeleteItem = id => {
    props.handleDelete(id);
  };

  const handleDuplicateItem = id => {
    props.handleDuplicate(id);
  };

  useEffect(() => {
    setShowingItems(props.items);

    return () => {
      setShowingItems([]);
    };
  }, [ props.items ]);

  const Rows = showingItems.map(item => {
    const key = 'card-' + cuid();
    const created = item.created ? getISOTime(item.created.seconds).split('T')[0] : 0;
    const updated = item.updated ? getISOTime(item.updated.seconds).split('T')[0] : 0;
    if (type === 'Transcript') {
      return (
        <>
          <TranscriptRow
            { ...item }
            created={ created }
            updated={ updated }
            key={ key }
            handleEditItem={ handleEditItem }
            handleDeleteItem={ handleDeleteItem }
          />
          <hr style={ { color: 'grey' } } />
        </>
      );
    } else {
      return (
        <>
          <ProjectRow
            { ...item }
            created={ created }
            updated={ updated }
            key={ key }
            handleDuplicateItem={ handleDuplicateItem }
            handleEditItem={ handleEditItem }
            handleDeleteItem={ handleDeleteItem }
          />
          <hr style={ { color: 'grey' } } />
        </>
      );
    }
  });

  return (
    <>
      <Row>
        <Col sm={ 9 }>
        </Col>
        <Col xs={ 12 } sm={ 3 }>
        </Col>
      </Row>

      <section style={ { height: '75vh', overflow: 'scroll' } }>
        {showingItems.length > 0 ? (
          Rows
        ) : (
          <i>There are no {type}s, create a new one to get started.</i>
        )}
      </section>
    </>
  );
};

ItemsContainer.propTypes = {
  handleDelete: PropTypes.func,
  handleDuplicate: PropTypes.func,
  handleEdit: PropTypes.func,
  handleSave: PropTypes.func,
  items: PropTypes.array.isRequired,
  type: PropTypes.string,
  uploadTasks: PropTypes.any
};

ItemsContainer.defaultProps = {
  type: 'Project'
};

export default React.memo(ItemsContainer);
