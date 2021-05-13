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
import './index.scss';

const TranscriptMenu = (props) => {
  const labels = props.labels;

  const setSelectedLabelColour = (transcriptLabels) => {
    const defaultColour = 'orange';

    if (transcriptLabels) {
      const tempLabels = JSON.parse(JSON.stringify(transcriptLabels));
      const activeLabel = tempLabels.find((label) => label.active);
      if (activeLabel) {
        return activeLabel.color;
      } else {
        const firstLabelInList = transcriptLabels[0];

        return firstLabelInList.color;
      }
    }

    return defaultColour;
  };

  const selectedLabelColour = setSelectedLabelColour(labels);

  const LabelButton = (
    <Button
      variant="outline-secondary"
      data-label-id={ 'default' }
      onClick={ (e) => {
        props.handleCreateAnnotation(e);
      } }
    >
      <FontAwesomeIcon icon={ faHighlighter } flip="horizontal" />
      <span className='TranscriptMenu__label-button-text'>Labels</span>
      <Col
        style={ { backgroundColor: selectedLabelColour } }
        className="TranscriptMenu__highlight-square"
      />
    </Button>
  );

  const EditLabelButton = (
    <DropdownButton
      as={ ButtonGroup }
      title={ <FontAwesomeIcon icon={ faCog } /> }
      id="bg-nested-dropdown"
      variant="outline-secondary"
      className="TranscriptMenu__edit-label-button"
    >
      <LabelsList
        labels={ labels }
        onLabelUpdate={ props.onLabelUpdate }
        onLabelCreate={ props.onLabelCreate }
        onLabelDelete={ props.onLabelDelete }
        updateLabelSelection={ props.updateLabelSelection }
      />
    </DropdownButton>
  );

  return (
    <Row>
      <Col xs={ 12 }>
        <ButtonGroup style={ { width: '100%' } }>
          <Dropdown as={ ButtonGroup } style={ { width: '100%' } }>
            {LabelButton}
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
