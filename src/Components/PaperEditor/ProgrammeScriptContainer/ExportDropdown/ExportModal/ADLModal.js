import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
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
  const [ validation, setValidation ] = useState(transcripts.reduce((res, tr) => {
    res[tr.id] = { frameColour: '1px solid grey', message: '' };

    return res;
  }, {}));

  const [ resetValidation, setResetValidation ] = useState(false);

  useEffect(() => {
    if (resetValidation) {
      setValidation((transcripts.reduce((res, tr) => {
        res[tr.id] = { frameColour: '1px solid grey', message: '' };

        return res;
      }, {})));
      setResetValidation(false);
    }

    return () => {
    };
  }, [ transcripts, resetValidation ]);

  const initialForm = transcripts.reduce((res, tr) => {
    res[`${ tr.id }-fileName`] = tr.title;
    res[`${ tr.id }-path`] = tr.path ? tr.path : 'localhost/C:/Audio Files';
    if (!tr.uuid) {
      res[`${ tr.id }-uuid`] = `BBCSPEECHEDITOR${ res.index }`;
      res.index += 1;
    } else {
      res[`${ tr.id }-uuid`] = tr.uuid;
    }

    return res;
  }, { index: 1 });

  delete initialForm.index;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const getExt = (fileName) => fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
  const adlSupportedExt = (ext) => (ext === 'wav' || ext === 'bwf');
  const validateFileName = (value) => {
    let error;
    if (!value) {
      error = 'Required';
    } else {
      const ext = getExt(value).toLowerCase();
      if (ext && !adlSupportedExt(ext)) {
        error = `Invalid ext: ADL does not support filenames with ${ ext }. Please remove ext.`;
      }
    }

    return error;
  };

  const validateForm = (values) => {
    const result = transcripts.reduce((res, tr) => {
      const uuidField = `${ tr.id }-uuid`;
      const pathField = `${ tr.id }-path`;
      const fileNameField = `${ tr.id }-fileName`;

      const fileName = values[fileNameField];
      const path = values[pathField];
      const uuid = values[uuidField];

      const fullPath = `${ path }/${ fileName }`;
      if (res[fullPath]) {
        const trMatchId = res[fullPath];
        res.validation = { ...res.validation,
          [tr.id]: { frameColour: '2px solid red', message: 'Validation failed - path and filename should be unique' },
          [trMatchId]: { frameColour: '2px solid red', message: 'Validation failed - path and filename should be unique' }
        };
        res.failed = true;
      } else if (res[uuid]) {
        const trMatchId = res[uuid];
        res.validation = { ...res.validation,
          [tr.id]: { frameColour: '2px solid red', message: 'Validation failed - uuid should be unique' },
          [trMatchId]: { frameColour: '2px solid red', message: 'Validation failed - uuid should be unique' }
        };
        res.failed = true;
      } else {
        res.validation = { ...res.validation, [tr.id]: { frameColour: '2px solid green', message: '' } };
        res[fullPath] = tr.id;
        res[uuid] = tr.id;

        res.values[tr.id] = { uuid: uuid, fileName: fileName, path: path };
      }

      return res;
    }, { failed: false, validation: {}, values: {} });
    setValidation(result.validation);

    return result;
  };

  const handleClose = () => {
    setResetValidation(true);
    props.handleClose();
  };

  const onSubmit = async (values, actions) => {
    await sleep(500);
    const formValidation = validateForm(values);
    if (!formValidation.failed) {

      props.onSubmit(formValidation.values);
    }
    actions.setSubmitting(false);
  };

  const fileNameForms = transcripts.map((tr) => {
    const frameColour = validation[tr.id].frameColour;
    const errorMsg = validation[tr.id].message;

    return (
      <div key={ `form-${ tr.id }` } style={ { paddingBottom: '1em' } }>
        <Card style={ { border: `${ frameColour }` } } >
          <Card.Header>{tr.title}</Card.Header>
          <Card.Body>
            {errorMsg ? <p style={ { color: 'red' } }>{errorMsg}</p> : null}
            <Row>
              <Col xs={ 3 }>
                Filename
              </Col>
              <Col xs={ 9 }>
                <Field style={ { width: '100%' } } name={ `${ tr.id }-fileName` }
                  validate={ async (value) => {
                    await sleep(2000);

                    return validateFileName(value);
                  }
                  } />
              </Col>
            </Row>
            <Row>
              <Col xs={ 3 }>
                Originator Reference
              </Col>
              <Col xs={ 9 }>
                <Field style={ { width: '100%' } } name={ `${ tr.id }-uuid` }/>
              </Col>
            </Row>
            <Row>
              <Col xs={ 3 }>
                Path
              </Col>
              <Col xs={ 9 }>
                <Field style={ { width: '100%' } } name={ `${ tr.id }-path` } />
              </Col>
            </Row>
            <Row style={ { color:'red' } }>
              <Col>
                <ErrorMessage name={ `${ tr.id }-fileName` } />
                <ErrorMessage name={ `${ tr.id }-path` } />
                <ErrorMessage name={ `${ tr.id }-uuid` } />
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  });

  return (
    <Modal style={ { maxWidth: '100%' } } show={ props.show } onHide={ handleClose } >
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
            <li ke={ 4 }>Take note of the media <strong>Originator Reference or filename</strong> in SaDiE.
              <Accordion.Toggle style={ { padding: 0 } } as={ Button } variant="link" eventKey="0">
                <FontAwesomeIcon icon={ faInfoCircle }></FontAwesomeIcon>
              </Accordion.Toggle>
            </li>
            <Accordion.Collapse eventKey="0">
              <Card.Body>
                {'The ADL file generates the events from the filenames and Originator Reference provided in the form below. '}
                {'SaDiE should find your files based on the filenames and Originator Reference. '}
              </Card.Body>
            </Accordion.Collapse>
          </Accordion>
        </ol>

        The following assets will be in the ADL.
        Please rename them to match the media Originator reference or filename in SaDiE.
        <strong>{'The path field is optional.'}</strong>

      </Modal.Body>
      <Modal.Body>
        <Formik
          initialValues={ initialForm }
          onSubmit={ onSubmit }>
          {({ isSubmitting }) => (
            <Form>
              {fileNameForms}
              <br />
              {"Once you've generated the ADL file successfully, please import it as an AES31 ADL file."}
              <Modal.Footer>
                <Button variant="secondary" onClick={ handleClose }>
                  Close
                </Button>
                <Button type="submit" disabled={ isSubmitting }>Submit</Button>
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
