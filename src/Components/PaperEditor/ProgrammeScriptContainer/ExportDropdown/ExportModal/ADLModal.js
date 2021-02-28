import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ADLModal = (props) => {

  const transcripts = props.transcripts;

  const onClick = () => {
    props.handleClick();
  };

  return (
    <Modal show={ props.show } onHide={ props.handleClose }>
      <Modal.Header closeButton>
        <Modal.Title>Generate ADL</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>For SaDiE Users</h5>
        Before you import the generated ADL file, please make sure that you have:
        <ol>
          <li key={ 1 }>Created a SaDiE project</li>
          <li key={ 2 }>[OPTIONAL] Downloaded media files from the Export menu.</li>
          <li ke={ 3 }>Imported media files with the below filenames (without extension - e.g. wav). </li>
        </ol>

        <h6>Why do we need to match the filenames?</h6>
        The generated ADL file uses the filenames below.
        SaDiE will use the filenames to automatically import source tracks.
        <br />
        {"Once you've generated the ADL file successfully, please import it as an AES31 ADL file."}
        <br />

      </Modal.Body>
      <Modal.Body>
        <Modal.Title>Filenames</Modal.Title>
        {transcripts.map(tr => {
          return (
            <li key={ `li-${ tr.id }` }>{tr.title}</li>
          );
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={ props.handleClose }>
          Cancel
        </Button>
        <Button variant="primary" onClick={ onClick }>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );

};

ADLModal.propTypes = {
  handleClick: PropTypes.func,
  handleClose: PropTypes.any,
  show: PropTypes.any,
  transcripts: PropTypes.any
};
export default ADLModal;
