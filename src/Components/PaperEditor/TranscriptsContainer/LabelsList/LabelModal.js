import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faPen
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import LabelForm from './LabelForm';
import PropTypes from 'prop-types';

const LabelModal = (props) => {
  const labelId = props.labelId;
  const color = props.color;
  const label = props.label;
  const description = props.description;

  const [ show, setShow ] = useState(false);

  const handleSave = (newLabel) => {
    props.handleSave(newLabel);
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };

  const DefaultButton = (
    <Button variant="outline-secondary" block>
      <FontAwesomeIcon icon={ faTag } /> Create New Label
    </Button>);

  return (
    <>
      {props.label === 'Default' ?
        { DefaultButton } :
        <Button variant="link" size="sm" onClick={ handleShow } block>
          <span>
            {' '}
            <FontAwesomeIcon icon={ faPen } />
          </span>
        </Button>
      }
      <Modal show={ show } onHide={ handleClose }>
        <Modal.Header closeButton onClick={ handleClose }>
          <Modal.Title><FontAwesomeIcon icon={ faTag } />  Label </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LabelForm
            handleSave={ handleSave }
            label={ label }
            description={ description }
            color={ color }
            labelId={ labelId }
            handleClose={ handleClose }
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

LabelModal.propTypes = {
  labelId: PropTypes.any,
  color: PropTypes.any,
  label: PropTypes.any,
  description: PropTypes.any,
  handleSave: PropTypes.any
};

export default LabelModal;