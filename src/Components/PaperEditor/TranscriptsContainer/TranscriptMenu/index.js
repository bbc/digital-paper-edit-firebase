import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import LabelsList from '../LabelsList/index.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTag } from '@fortawesome/free-solid-svg-icons';
import './index.scss';

const TranscriptMenu = (props) => {
  const { labels, activeLabel, onLabelSelect } = props;

  useEffect(() => {
    if (labels) {
      const defaultLabel = labels.find((label) => label.label === 'Default');
      if (!activeLabel) onLabelSelect(defaultLabel);
    }
  }, [ activeLabel, labels, onLabelSelect ]);

  const LabelButton = (
    <Button
      variant="outline-secondary"
      data-label-id={ 'default' }
      onClick={ (e) => {
        props.handleCreateAnnotation(e);
      } }
    >
      <FontAwesomeIcon icon={ faTag } flip="horizontal" />
      <span className='TranscriptMenu__label-button-text'>Label</span>
      <Col
        style={ { backgroundColor: activeLabel?.color } }
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
        activeLabel= { activeLabel }
        onLabelUpdate={ props.onLabelUpdate }
        onLabelCreate={ props.onLabelCreate }
        onLabelDelete={ props.onLabelDelete }
        onLabelSelect = { props.onLabelSelect }
        trackEvent = { props.trackEvent }
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
  labels: PropTypes.array,
  activeLabel: PropTypes.any,
  onLabelCreate: PropTypes.any,
  onLabelDelete: PropTypes.any,
  onLabelUpdate: PropTypes.any,
  onLabelSelect: PropTypes.any,
  trackEvent: PropTypes.any,
};

export default TranscriptMenu;
