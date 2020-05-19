import React, { useState, useEffect, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import ExportForm from './ExportForm';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';

const ExportFormModal = props => {
  const [ showModal, setShowModal ] = useState();
  const [ isWindows, setIsWindows ] = useState(props.isWindows);

  const WINDOWS_PLACEHOLDER = 'D:\\Example\\Path';
  const WINDOWS_PATH_JOIN = '\\';
  const UNIX_PLACEHOLDER = '/Example/Path';
  const UNIX_PATH_JOIN = '/';

  const [ placeholder, setPlaceholder ] = useState(WINDOWS_PLACEHOLDER);
  const [ pathJoin, setPathJoin ] = useState(WINDOWS_PATH_JOIN);

  useEffect(() => {
    if (isWindows) {
      setPlaceholder(WINDOWS_PLACEHOLDER);
      setPathJoin(WINDOWS_PATH_JOIN);
    } else {
      setPlaceholder(UNIX_PLACEHOLDER);
      setPathJoin(UNIX_PATH_JOIN);
    }

    return () => {};
  }, [ isWindows ]);

  useLayoutEffect(() => {
    setShowModal(props.showModal);

    return () => {};
  }, [ props.showModal ]);

  return (
    <Modal show={ showModal } onHide={ props.handleOnHide }>
      <Modal.Header closeButton>
        <Container>
          <Row>
            <Col sm={ 8 }>
              <Modal.Title>Export {props.type}</Modal.Title>
            </Col>
            <Col sm={ 4 }>
              <BootstrapSwitchButton
                checked={ isWindows }
                onlabel='Windows'
                onstyle='success'
                offlabel='Mac/Linux'
                offstyle='info'
                style={ 'w-100 mx-2' }
                onChange={ setIsWindows }
              />
            </Col>
          </Row>
        </Container>
      </Modal.Header>

      <Modal.Body>
        <ExportForm
          { ...props }
          pathJoin={ pathJoin }
          placeholder={ placeholder }
        />
      </Modal.Body>
    </Modal>
  );
};

ExportFormModal.propTypes = {
  handleOnHide: PropTypes.any,
  isWindows: PropTypes.bool,
  showModal: PropTypes.bool,
  type: PropTypes.any
};

ExportFormModal.defaultProps = {
  showModal: false,
  isWindows: true
};

export default ExportFormModal;
