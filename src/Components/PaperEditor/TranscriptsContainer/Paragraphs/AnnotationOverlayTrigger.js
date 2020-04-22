import React from 'react';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faStickyNote,
  faTrashAlt,
  faTag
} from '@fortawesome/free-solid-svg-icons';

const AnnotationOverlayTrigger = (props) => {

  const handleEdit = () => {
    let text;
    props.handleEditAnnotation(props.annotationId, text);
  };

  let overlayContent;

  if (props.labelsOptions) {
    let label = props.labelsOptions.find((l) => {

      return l.id === props.annotationLabelId;
    });

    if (!label) {
      label = props.labelsOptions[0];
    }

    overlayContent = <OverlayTrigger rootClose={ true } trigger="click" placement="bottom"
      overlay={
        <Popover id="popover-basic">
          <Row>
            <Col md={ 1 } style={ { backgroundColor: label.color, marginLeft: '1em' } }></Col>
            <Col >
              <FontAwesomeIcon icon={ faTag } />  {label.label}
            </Col>
            <Col md={ 1 } style={ { marginRight: '1em' } }
              onClick={ () => { props.handleDeleteAnnotation(props.annotationId); } }>
              <FontAwesomeIcon icon={ faTrashAlt } />
            </Col>
          </Row>
          <hr />
          <FontAwesomeIcon icon={ faStickyNote }
            onClick={ handleEdit }
          />   {props.annotationNote}
          <br />
          <FontAwesomeIcon icon={ faPen }
            onClick={ handleEdit }
          />
        </Popover>
      }
    >
      <span style={ { borderBottom: `0.1em ${ label.color } solid` } } className={ 'highlight' }>{props.words}</span>
    </OverlayTrigger>;
  };

  return (<>
    {overlayContent}
  </>
  );
};

AnnotationOverlayTrigger.propTypes = {
  annotationId: PropTypes.string,
  annotationLabelId: PropTypes.string,
  annotationNote: PropTypes.string,
  handleDeleteAnnotation: PropTypes.any,
  handleEditAnnotation: PropTypes.any,
  labelsOptions: PropTypes.any,
  words: PropTypes.any
};

export default AnnotationOverlayTrigger;