import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import LabelForm from './LabelForm';
import PropTypes from 'prop-types';

const LabelModal = (props) => {
  const { labelId, color, label, description,
    showButtonText, showButtonVariant, showButtonSize } = props;

  const [ showModal, setShowModal ] = useState(false);

  const handleSave = (newLabel) => {
    props.handleSave(newLabel);
    setShowModal(false);
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant={ showButtonVariant }
        size={ showButtonSize }
        onClick={ handleShow }
        block>
        {showButtonText}
      </Button>
      <Modal show={ showModal } onHide={ handleClose }>
        <Modal.Header closeButton onClick={ handleClose }>
          <Modal.Title><FontAwesomeIcon icon={ faTag } />  Label </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LabelForm
            handleSave={ (e) => handleSave(e) }
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
  color: PropTypes.any,
  description: PropTypes.any,
  handleSave: PropTypes.func,
  label: PropTypes.any,
  labelId: PropTypes.any,
  showButtonSize: PropTypes.any,
  showButtonText: PropTypes.any,
  showButtonVariant: PropTypes.any
};

export default LabelModal;