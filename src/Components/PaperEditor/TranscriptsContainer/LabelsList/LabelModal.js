import React, { Component, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import LabelForm from './LabelForm';

const LabelModal = (props) => {
  console.log('label modal props', props);
  const [ show, setShow ] = useState(false);
  const [ openBtn, setOpenBtn ] = useState(false);
  const [ color, setColor ] = useState(props.color);
  const [ label, setLabel ] = useState(props.label);
  const [ description, setDescription ] = useState(props.description);
  const [ labelId, setLabelId ] = useState(props.labelId);
  const [ onLabelSaved, setOnLabelSaved ] = useState(props.onLabelSaved);

  const handleClose = () => {
    setShow({
      show: false,
      // color: randomColor(),
      // label: '',
      // description: ''
    });
    // Clear all input fields in form?
  };

  const handleShow = () => {
    setShow({ show: true });
  };

  return (
    <>
      <Button variant="link" size="sm" onClick={ handleShow } block>
        { openBtn }
      </Button>
      <Modal show={ show } onHide={ handleClose }>
        <Modal.Header closeButton>
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

class LabelModal2 extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      show: false,
      color: this.props.color,
      label: this.props.label,
      description:  this.props.description,
      labelId: this.props.labelId
    };
  }

  handleClose = () => {
    this.setState({
      show: false,
      // color: randomColor(),
      // label: '',
      // description: ''
    });
    // Clear all input fields in form?
  }

  handleShow = () => {
    this.setState({ show: true });
  }

  render() {
    return (
      <>
        <Button variant="link" size="sm" onClick={ this.handleShow } block>
          {this.props.openBtn}
        </Button>
        <Modal show={ this.state.show } onHide={ this.handleClose }>
          <Modal.Header closeButton>
            <Modal.Title><FontAwesomeIcon icon={ faTag } />  Label </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <LabelForm
              onLabelSaved={ this.props.onLabelSaved }
              label={ this.props.label }
              description={ this.props.description }
              color={ this.props.color }
              labelId={ this.props.labelId }
              handleClose={ this.handleClose }
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }
}
export default LabelModal;