import PropTypes from 'prop-types';
import React from 'react';
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
  const labels = props.labels; // rename from labelsOptiosn
  // const labels = props.labels;
  const handleClick = (annotations) => {
    //setAnnotations
    props.handleClick(annotations);
  };

  const HighlightButton = (
    <Button
      variant="outline-secondary"
      data-label-id={ 'default' }
      onClick={ handleClick }
    >
      <FontAwesomeIcon icon={ faHighlighter } flip="horizontal" /> Highlight
    </Button>
  );

  const LabelButton = (
    <DropdownButton
      drop={ 'right' }
      as={ ButtonGroup }
      title={ <FontAwesomeIcon icon={ faCog } /> }
      id="bg-nested-dropdown"
      variant="outline-secondary"
    >
      <LabelsList
      // isLabelsListOpen={ isLabelsListOpen }
      // labels={
      //   labels && labels
      // }
      // onLabelUpdate={ onLabelUpdate }
      // onLabelCreate={ onLabelCreate }
      // onLabelDelete={ onLabelDelete }
      />
    </DropdownButton>
  );

  const Labels = () =>
    labels.map((labelItem) => {
      const { id, color, label } = labelItem;

      return (
        <Dropdown.Item
          key={ `label_id_${ id }` }
          data-label-id={ id }
        >
          <Row data-label-id={ id }>
            <Col
              xs={ 1 }
              style={ { backgroundColor: color } }
              data-label-id={ id }
            />
            <Col xs={ 1 } data-label-id={ id }>
              {label}
            </Col>
          </Row>
        </Dropdown.Item>
      );
    });

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
            <Dropdown.Menu onClick={ handleClick }>
              {labels ? Labels() : null}
            </Dropdown.Menu>
          </Dropdown>
          {LabelButton}
        </ButtonGroup>
      </Col>
    </Row>
  );
};

TranscriptMenu.propTypes = {
  handleClick: PropTypes.func,
  labels: PropTypes.array
};

export default TranscriptMenu;
