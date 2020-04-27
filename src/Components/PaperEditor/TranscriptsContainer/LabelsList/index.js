import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTags,
  faTimes,
  faPen,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import cuid from 'cuid';

import LabelModal from './LabelModal.js';
import { randomColor } from './css-color-names.js';
import PropTypes from 'prop-types';

const LabelsList = (props) => {
  const labels = props.labels;
  const onLabelDelete = props.onLabelDelete;
  const onLabelCreate = props.onLabelCreate;
  const onLabelUpdate = props.onLabelUpdate;

  const removeLabel = (id) => {
    const response = window.confirm(
      'Click OK to delete the label, Cancel if you changed your mind'
    );
    if (response) {
      onLabelDelete(id);
    } else {
      alert('Your label was not deleted');
    }
  };

  // TODO: See if CreateNewLabelModal can be refactored to accomodate for edit label
  // if not then separate model to achieve same
  // https://stackoverflow.com/questions/43335452/pass-item-data-to-a-react-modal
  const editLabel = (id, e) => {
    const labelToEdit = labels.filter((label) => label.id === id);
    onLabelUpdate(labelToEdit.id, labelToEdit);
  };

  const handleSave = (newLabel) => {
    if (newLabel.id) {
      onLabelUpdate(newLabel.id, newLabel);
    } else {
      onLabelCreate(newLabel);
    }
  };

  const EditableLabel = (id, label, color, description) => {
    return (
      <>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <LabelModal
            color={ color }
            label={ label }
            description={ description }
            labelId={ id }
            handleSave={ handleSave }
          />
        </Col>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <Button
            title={ 'delete label' }
            variant="link"
            size="sm"
            onClick={ (e) => {
              removeLabel(id, e);
            } }
            disabled={ false }
          >
            <FontAwesomeIcon icon={ faTimes } />
          </Button>
        </Col>
      </>
    );
  };

  const NonEditableLabel = (id) => {
    return (
      <>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <Button
            title={ 'edit label' }
            variant="link"
            size="sm"
            onClick={ (e) => {
              editLabel(id, e);
            } }
            disabled={ true }
          >
            <FontAwesomeIcon icon={ faPen } />{' '}
          </Button>
        </Col>
        <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
          <Button
            title={ 'delete label' }
            variant="link"
            size="sm"
            onClick={ (e) => {
              removeLabel(id, e);
            } }
            disabled={ true }
          >
            <FontAwesomeIcon icon={ faTimes } />
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
      const { label, color, id, description } = l;

      return (
        <ListGroup.Item style={ { width: '100%' } } key={ cuid() }>
          <Row>
            <Col
              xs={ 1 }
              sm={ 1 }
              md={ 1 }
              lg={ 1 }
              xl={ 1 }
              style={ { backgroundColor: color } }
              title={ label }
            ></Col>
            <Col xs={ 6 } sm={ 6 } md={ 6 } lg={ 6 } xl={ 6 } title={ label }>
              {label}
            </Col>

            {label === 'Default'
              ? NonEditableLabel(id)
              : EditableLabel(id, color, label, description)}
          </Row>
          <Row>
            {/* Spacing to align title and color */}
            <Col
              xs={ 1 }
              sm={ 1 }
              md={ 1 }
              lg={ 1 }
              xl={ 1 }
              className="text-truncate"
              title={ label }
            ></Col>
            <Col xs={ 10 } sm={ 10 } md={ 10 } lg={ 10 } xl={ 10 }>
              <Form.Text title={ description }>{description}</Form.Text>
            </Col>
          </Row>
        </ListGroup.Item>
      );
    });
  }

  const labelsList = (
    <ListGroup
      style={ {
        height: '50vh',
        width: '20vw',
        overflowY: 'scroll',
        overflowX: 'hidden',
      } }
    >
      {labelEls}
    </ListGroup>
  );

  return (
    <Card>
      <Card.Header>
        <FontAwesomeIcon icon={ faTags } /> <FontAwesomeIcon icon={ faCog } />{' '}
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
};

export default LabelsList;
