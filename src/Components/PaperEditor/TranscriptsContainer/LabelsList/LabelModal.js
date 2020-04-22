import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import LabelForm from './LabelForm';
import PropTypes from 'prop-types';

const LabelModal = (props) => {
  const labelId = props.labelId;
  const openBtn = props.openBtn;
  const color = props.color;
  const label = props.label;
  const description = props.description;
  const onLabelSaved = props.onLabelSaved;

  const [ show, setShow ] = useState(false);

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };

  return (
    <>
      <Button variant="link" size="sm" onClick={ handleShow } block>
        { openBtn }
      </Button>
      <Modal show={ show } onHide={ handleClose }>
        <Modal.Header closeButton onClick={ handleClose }>
          <Modal.Title><FontAwesomeIcon icon={ faTag } />  Label </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LabelForm
            onLabelSaved={ onLabelSaved }
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
  openBtn: PropTypes.any,
  labelId: PropTypes.any,
  color: PropTypes.any,
  label: PropTypes.any,
  description: PropTypes.any,
  onLabelSaved: PropTypes.any
};

export default LabelModal;