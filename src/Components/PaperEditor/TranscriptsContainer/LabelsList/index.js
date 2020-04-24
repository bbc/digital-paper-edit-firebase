import React, { useState } from 'react';
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
  faCog
} from '@fortawesome/free-solid-svg-icons';

import LabelModal from './LabelModal.js';
import { randomColor } from './css-color-names.js';
import PropTypes from 'prop-types';
import cuid from 'cuid';

const LabelsList = (props) => {
  const labels = props.labels;
  const isLabelsListOpen = props.isLabelsListOpen;
  const onLabelDelete = props.onLabelDelete;
  const onLabelCreate = props.onLabelCreate;
  const onLabelUpdate = props.onLabelUpdate;

  const [ isLabelmodalShown, setIsLabelmodalShown ] = useState(false);

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
    const labelToEdit = labels.filter(label => {
      return label.id === id;
    });
    onLabelUpdate(labelToEdit.id, labelToEdit);
  };

  const handleSave = newLabel => {
    if (newLabel.id) {
      onLabelUpdate(newLabel.id, newLabel);
    }
    // if created
    else {
      onLabelCreate(newLabel);
    }
  };

  // TODO: add CSS to label and description to constrain width?
  // move edit and X to the rigth
  let labelEls;
  // Handle edge case if there's no labels
  if (labels) {
    labelEls = labels.map((label) => {
      return (
        <ListGroup.Item style={ { width: '100%' } } key={ cuid() }>
          <Row>
            {/* Col space for the label color */}
            <Col
              xs={ 1 }
              sm={ 1 }
              md={ 1 }
              lg={ 1 }
              xl={ 1 }
              style={ { backgroundColor: label.color } }
              title={ label.label }
            ></Col>
            <Col
              xs={ 6 }
              sm={ 6 }
              md={ 6 }
              lg={ 6 }
              xl={ 6 }
              // className="text-truncate"
              title={ label.label }
            >
              {label.label}
            </Col>

            <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
              {/* Edit label */}

              {label.label !== 'Default' ? (
                <LabelModal
                  color={ label.color }
                  label={ label.label }
                  description={ label.description }
                  labelId={ label.id }
                  show={ isLabelmodalShown }
                  handleSave={ handleSave }
                />
              ) : (
                <Button
                  title={ 'edit label' }
                  variant="link"
                  size="sm"
                  onClick={ e => {
                    editLabel(label.id, e);
                  } }
                  disabled={
                    label.label === 'Default' ? true : false
                  }
                >
                  <FontAwesomeIcon icon={ faPen } />{' '}
                </Button>
              )}
            </Col>
            <Col xs={ 1 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
              <Button
                title={ 'delete label' }
                variant="link"
                size="sm"
                onClick={ e => {
                  removeLabel(label.id, e);
                } }
                disabled={
                  label.label === 'Default' ? true : false
                }
              >
                <FontAwesomeIcon icon={ faTimes } />
              </Button>
            </Col>
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
              title={ label.label }
            ></Col>
            <Col xs={ 10 } sm={ 10 } md={ 10 } lg={ 10 } xl={ 10 }>
              <Form.Text
                // className={ [ 'text-muted', 'text-truncate' ].join(' ') }
                title={ label.description }
              >
                {label.description}
              </Form.Text>
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
        overflowX: 'hidden'
      } }
    >
      {labelEls}
    </ListGroup>
  );

  return (
    <>
      {isLabelsListOpen ? (
        <>
          <Card>
            <Card.Header>
              <FontAwesomeIcon icon={ faTags } />{' '}
              <FontAwesomeIcon icon={ faCog } /> Labels
            </Card.Header>
            {labelsList}
            <Card.Footer className="text-muted">
              <LabelModal
                color={ randomColor() }
                label={ '' }
                description={ '' }
                labelId={ null }
                show={ isLabelmodalShown }
                handleSave={ handleSave }
              />
            </Card.Footer>
          </Card>
        </>
      ) : (
        ''
      )}
    </>
  );

};

LabelsList.propTypes = {
  labels: PropTypes.any,
  isLabelsListOpen: PropTypes.any,
  onLabelDelete: PropTypes.any,
  onLabelCreate: PropTypes.any,
  onLabelUpdate: PropTypes.any
};

export default LabelsList;
