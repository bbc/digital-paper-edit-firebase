import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faStickyNote,
  faTrashAlt,
  faTag,
} from '@fortawesome/free-solid-svg-icons';

const AnnotationOverlayTrigger = (props) => {
  const {
    handleEditAnnotation,
    handleDeleteAnnotation,
    annotation,
    labels,
    words,
  } = props;
  const { labelId, id, note } = annotation;
  const [ label, setLabel ] = useState('');
  const [ color, setColor ] = useState('');

  useEffect(() => {
    // handling edge case when labels are not available
    if (labels) {
      const annotationLabel = labels.find((lb) => lb.id === labelId);
      // TODO: Quick fix - needs digging into why sometimes adding a new label crashes, and the `find` function above returns undefined
      const lbl = annotationLabel ? annotationLabel : labels[0];

      if (lbl) {
        setColor(lbl.color);
        setLabel(lbl.label);
      }
    }

    return () => {};
  }, [ labels, labelId ]);

  const overlay = (
    <Popover id="popover-basic">
      <Row>
        <Col md={ 1 } style={ { backgroundColor: color, marginLeft: '1em' } } />
        <Col>
          <FontAwesomeIcon icon={ faTag } /> {label}
        </Col>
        <Col
          md={ 1 }
          style={ { marginRight: '1em' } }
          onClick={ () => handleDeleteAnnotation(id) }
        >
          <FontAwesomeIcon icon={ faTrashAlt } />
        </Col>
      </Row>
      <hr />
      <FontAwesomeIcon
        icon={ faStickyNote }
        onClick={ () => handleEditAnnotation(id, '') }
      />{' '}
      {note}
      <br />
      <FontAwesomeIcon icon={ faPen } onClick={ () => handleEditAnnotation(id) } />
    </Popover>
  );

  const OverlayContent = (
    <OverlayTrigger
      rootClose={ true }
      trigger="click"
      placement="bottom"
      overlay={ overlay }
    >
      <span
        style={ { borderBottom: `0.2em ${ color } solid` } }
        className={ 'highlight' }
      >
        {words}
      </span>
    </OverlayTrigger>
  );

  return <>{color && label ? OverlayContent : null}</>;
};

AnnotationOverlayTrigger.propTypes = {
  annotation: PropTypes.any,
  handleDeleteAnnotation: PropTypes.func,
  handleEditAnnotation: PropTypes.func,
  labels: PropTypes.array,
  words: PropTypes.any,
};

export default AnnotationOverlayTrigger;
