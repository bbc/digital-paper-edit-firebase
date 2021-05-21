import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faTrash,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import cuid from 'cuid';

import LabelModal from './LabelModal.js';
import { randomColor } from './css-color-names.js';
import PropTypes from 'prop-types';

import './index.scss';

const LabelsList = (props) => {
  const { labels, onLabelDelete, onLabelCreate, onLabelUpdate, onLabelSelect, trackEvent } = props;

  const handleDelete = (label) => {
    const response = window.confirm(
      'Click OK to delete the label, Cancel if you changed your mind'
    );

    if (response) {
      onLabelDelete(label);
    }
  };

  const handleEdit = (id) => {
    const labelToEdit = labels.filter((label) => label.id === id);
    onLabelUpdate(labelToEdit.id, labelToEdit);
  };

  const handleSave = (newLabel) => {
    if (newLabel.id) {
      onLabelUpdate(newLabel.id, newLabel);
    } else {
      onLabelCreate(newLabel);
    }
    onLabelSelect(newLabel);
  };

  const EditableLabel = (l) => {
    const { color, label, description, id } = l;

    return (
      <>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 } className='LabelsList__label-button edit'>
          <LabelModal
            color={ color }
            label={ label }
            description={ description }
            labelId={ id }
            handleSave={ handleSave }
            showButtonVariant={ 'link' }
            showButtonSize={ 'sm' }
            showButtonText={
              <span>
                <FontAwesomeIcon icon={ faPen } className="LabelsList__action-icon"/>
              </span> }
          />
        </Col>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 } className='LabelsList__label-button'>
          <Button
            title={ 'delete label' }
            variant="link"
            size="sm"
            onClick={ (e) => {
              handleDelete(l, e);
            } }
            disabled={ false }
          >
            <FontAwesomeIcon icon={ faTrash } className="LabelsList__action-icon"/>
          </Button>
        </Col>
      </>
    );
  };

  const NonEditableLabel = (label) => {
    return (
      <>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <Button
            title={ 'edit label' }
            variant="link"
            size="sm"
            onClick={ (e) => handleEdit(label.id, e) }
            disabled={ true }
            style= { { padding: 0 } }
          >
          </Button>
        </Col>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <Button
            title={ 'delete label' }
            variant="link"
            size="sm"
            onClick={ (e) => handleDelete(label, e) }
            disabled={ true }
            style= { { padding: 0 } }
          >
          </Button>
        </Col>
      </>
    );
  };

  // TODO: add CSS to label and description to constrain width?
  // move edit and X to the rigth
  let labelEls;

  if (labels) {
    labelEls = labels.map((l) => {
      const { label, color, id } = l;

      return (
        <ListGroup.Item
          key={ cuid() }
          className='LabelsList__list-item'
          href='#'
          style= { { backgroundColor: 'white', borderColor: 'rgba(0, 0, 0, 0.125)' } }>
          <Row>
            <button
              className='LabelsList__label-element'
              onClick={ () => {
                onLabelSelect(l);
                trackEvent({ category: 'paperEditor transcriptsTab', action: `label select ${ id }` });
              } }
            >
              <span
                className='LabelsList__label-color-square'
                style= { { backgroundColor: color } }
              />
              <Col xs={ 6 } sm={ 6 } md={ 6 } lg={ 6 } xl={ 6 } title={ label } className='LabelsList__label-text'>
                {label}
              </Col>
            </ button>

            {label === 'Default'
              ? NonEditableLabel(l)
              : EditableLabel(l)}
          </Row>
        </ListGroup.Item>
      );
    });
  }

  const labelsList = (
    <ListGroup className='LabelsList__dropdown-list'>
      {labelEls}
    </ListGroup>
  );

  return (
    <Card>
      <Card.Header className='LabelsList__dropdown-card-header'>
        Labels
      </Card.Header>
      {labelsList}
      <Card.Footer className="text-muted">
        <LabelModal
          color={ randomColor() }
          label={ '' }
          description={ '' }
          labelId={ null }
          handleSave={ handleSave }
          showButtonVariant={ 'outline-secondary' }
          showButtonSize={ '' }
          showButtonText={
            <span>
              <FontAwesomeIcon icon={ faTag } />
              {' '}Create New Label
            </span> }
        />
      </Card.Footer>
    </Card>
  );
};

LabelsList.propTypes = {
  labels: PropTypes.any,
  onLabelDelete: PropTypes.any,
  onLabelCreate: PropTypes.any,
  onLabelUpdate: PropTypes.any,
  onLabelSelect: PropTypes. any,
  trackEvent: PropTypes. any,
};

export default LabelsList;
