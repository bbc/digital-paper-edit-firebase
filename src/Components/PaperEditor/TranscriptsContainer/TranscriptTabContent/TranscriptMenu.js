import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import LabelsList from '../LabelsList/index.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHighlighter, faCog } from '@fortawesome/free-solid-svg-icons';

const TranscriptMenu = (props) => {
  const labels = props.labels;

  const HighlightButton = (
    <Button
      variant="outline-secondary"
      data-label-id={ 'default' }
      onClick={ (e) => props.handleCreateAnnotation(e) }
    >
      <FontAwesomeIcon icon={ faHighlighter } flip="horizontal" /> Highlight
    </Button>
  );

  const EditLabelButton = (
    <DropdownButton
      drop={ 'right' }
      as={ ButtonGroup }
      title={ <FontAwesomeIcon icon={ faCog } /> }
      id="bg-nested-dropdown"
      variant="outline-secondary"
    >
      <LabelsList
        labels={ labels && labels }
        onLabelUpdate={ props.onLabelUpdate }
        onLabelCreate={ props.onLabelCreate }
        onLabelDelete={ props.onLabelDelete }
      />
    </DropdownButton>
  );

  const Labels = () =>
    labels.map((label) => (
      <Dropdown.Item key={ `label_id_${ label.id }` } data-label-id={ label.id }>
        <Row
          value={ label.id }
          onClick={ (e) => props.updateLabelSelection(e, label.id) }
          data-label-id={ label.id }
        >
          <Col
            xs={ 1 }
            style={ { backgroundColor: label.color } }
            data-label-id={ label.id }
          ></Col>
          <Col xs={ 1 } data-label-id={ label.id }>
            {label.label}
          </Col>
        </Row>
      </Dropdown.Item>
    ));

  return (
    <Row>
      <Col xs={ 12 }>
        <ButtonGroup style={ { width: '100%' } }>
          <Dropdown as={ ButtonGroup } style={ { width: '100%' } }>
            {HighlightButton}
            <Dropdown.Toggle
              split
              variant="outline-secondary"
              data-lable-id={ 0 }
            />
            <Dropdown.Menu>{labels ? Labels() : null}</Dropdown.Menu>
          </Dropdown>
          {EditLabelButton}
        </ButtonGroup>
      </Col>
    </Row>
  );
};

TranscriptMenu.propTypes = {
  handleCreateAnnotation: PropTypes.func,
  updateLabelSelection: PropTypes.func,
  labels: PropTypes.array,
  onLabelCreate: PropTypes.any,
  onLabelDelete: PropTypes.any,
  onLabelUpdate: PropTypes.any,
};

export default TranscriptMenu;
