import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Formik, Form, Field, ErrorMessage } from 'formik';

const ADLModal = (props) => {

  const transcripts = props.transcripts;
  const initialForm = transcripts.reduce((res, tr) => {
    res[tr.id] = tr.title;

    return res;
  }, {});

  const getExt = (fileName) => fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
  const adlSupportedExt = (ext) => (ext === 'wav' || ext === 'bwf');
  const validateFileName = (value) => {
    let error;
    if (!value) {
      error = 'Required';
    } else {
      const ext = getExt(value);
      if (ext && !adlSupportedExt(ext)) {
        error = `Invalid ext: ADL does not support filenames with ${ ext }. Please remove ext.`;
      }
    }

    return error;
  };

  const onSubmit = (values) => {
    props.onSubmit(values);
  };

  const FormHeader = <Col>
    <Row>
      <Col xs={ 4 }>
        <h6>Title</h6>
      </Col>
      <Col xs={ 8 }>
        <h6>ADL source filename</h6>
      </Col>
    </Row>
  </Col>;

  const filenameForms = transcripts.map(tr => {
    return (
      <Col key={ `form-${ tr.id }` }>
        <Row>
          <Col xs={ 4 }>
            {tr.title}
          </Col>
          <Col xs={ 8 }>
            <Field style={ { width: '100%' } } name={ `${ tr.id }` } validate={ validateFileName } />
          </Col>
        </Row>
        <Row style={ { color:'red' } }>
          <Col>
            <ErrorMessage name={ tr.id } />
          </Col>
        </Row>
      </Col>
    );
  });

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Generate ADL</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <h5>For SaDiE Users</h5>
        Before you import the generated ADL file, please:
        <ol>
          <li key={ 1 }>Create a SaDiE project</li>
          <li key={ 2 }>[OPTIONAL] Download media files from the Export menu.</li>
          <li ke={ 3 }>Import media files to your SaDiE project.</li>

          <Accordion>
            <li ke={ 4 }>Make sure that the media filenames match the filenames in the ADL.
              <Accordion.Toggle style={ { padding: 0 } } as={ Button } variant="link" eventKey="0">
                <FontAwesomeIcon icon={ faInfoCircle }></FontAwesomeIcon>
              </Accordion.Toggle>
            </li>
            <Accordion.Collapse eventKey="0">
              <Card.Body>
                {'The ADL file generates a list of source filenames from the filenames provided. '}
                {'SaDiE will use these to automatically import source tracks.'}
              </Card.Body>
            </Accordion.Collapse>
          </Accordion>
        </ol>

        The following assets will be in the ADL.
        Please rename them to match the media filenames in SaDiE.

      </Modal.Body>
      <Modal.Body>
        <Formik
          initialValues={ initialForm }
          onSubmit={ onSubmit }>
          {() => (
            <Form>
              {FormHeader}
              {filenameForms}
              <br />
              {"Once you've generated the ADL file successfully, please import it as an AES31 ADL file."}
              <Modal.Footer>
                <Button variant="secondary" onClick={ props.handleClose }>
                  Close
                </Button>
                <Button type="submit">Submit</Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );

};

ADLModal.propTypes = {
  onSubmit: PropTypes.func,
  handleClose: PropTypes.any,
  show: PropTypes.any,
  transcripts: PropTypes.any
};
export default ADLModal;
