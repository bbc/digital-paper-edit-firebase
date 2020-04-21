import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { GithubPicker } from 'react-color';
import { colorNamesList, randomColor } from './css-color-names.js';
import chroma from 'chroma-js';
import PropTypes from 'prop-types';

const LabelForm = (props) => {
  console.log('labelform props', props);
  const labelId = props.labelId;
  const [ color, setColor ] = useState(props.color);
  const [ label, setLabel ] = useState({});
  const [ name, setName ] = useState(props.label);
  const [ description, setDescription ] = useState(props.description);

  useEffect(() => {
    const setTempLabel = () => {
      console.log('Use effect label', label);
      let tempLabel;
      if (!label) {
        tempLabel = {
          label: '',
          description: ''
        };
      } else {
        tempLabel = {
          value: color,
          label: name,
          color: color,
          description: description,
          id: labelId
        };
      }
      setLabel(tempLabel);
      console.log('Label after update: : : ', label);
    };

    if (!label) {
      setTempLabel();
    };
  }, [ label ]);

  const handleRandomiseColor = () => {
    setColor(randomColor());
  };

  const handleColorPickerChangeComplete = () => {
    setColor({ color: chroma(color.hex).name() });
  };

  const handleManualColorChange = (e) => {
    if (e && e.target && e.target.value) {
      const colorValue = e.target.value;
      setColor({ color: chroma.valid(colorValue) ? chroma(colorValue).name() : colorValue });
    }
    else if (e && e.target && e.target.value === '') {
      setColor({ color: '' });
    }
  };

  // const handleColorSelectChange = newColor => {
  //   setColor({ color: newColor.color });
  // };

  const handleSave = () => {
    console.log('description in handle save: : :', description);
    // checks color in color picker input is valid - can be color name in letters or hex
    // if (chroma.valid(color)) {
    // checks label name is not empty
    if (label !== '') {
      const tempLabel = {
        value: color,
        label: name,
        color: color,
        description: description,
        id: labelId
      };

      console.log('Temporary label: : : ', tempLabel);

      setLabel(tempLabel);

      props.onLabelSaved(tempLabel);

      // handleClose();
    }
    // else {
    //   alert('add a name to the label to be able to save');
    // }
    // }
    else {
      alert('choose a valid color');
    }
  };

  return (
    <>
      <Form>
        <Form.Group controlId="formGroupEmail">
          <Form.Label>Label Name </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter label name"
            defaultValue={ name }
            onInput={ (e) => setName(e.target.value) }
          />
          <Form.Text className="text-muted">
            Required label name
          </Form.Text>
        </Form.Group>
        <Form.Group controlId="formGroupPassword">
          <Form.Label>Label Description</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter label description"
            defaultValue={ description }
            as="textarea" rows="3"
            onInput={ (e) => setDescription(e.target.value) }
          />
          <Form.Text className="text-muted">
            Optional label description
          </Form.Text>
        </Form.Group>

        <Form.Group controlId="formGroupPassword">
          <Form.Label>Color</Form.Label>
          <Row>
            <Col xs={ 2 } sm={ 1 } md={ 1 } lg={ 1 } xl={ 1 }>
              <Button onClick={ handleRandomiseColor } variant="light" size="sm">
                <FontAwesomeIcon icon={ faSyncAlt } />
              </Button>
            </Col>
            <Col xs={ 6 } sm={ 6 } md={ 6 } lg={ 6 } xl={ 6 }>
              <Form.Control
                value={ color }
                type="text"
                placeholder="#"
                onChange={ handleManualColorChange }
              />
            </Col>
            <Col xs={ 2 } sm={ 2 } md={ 2 } lg={ 2 } xl={ 2 }
              style={ {
                backgroundColor: color,
                border: 'solid',
                borderWidth: '0.01em',
                borderColor: 'grey',
                padding: '0'
              } }>
            </Col>
          </Row>
          <Row>
            <Col xs={ 12 } sm={ 12 } md={ 12 } lg={ 12 } xl={ 12 } >
              <Form.Text className="text-muted">
                To pick a color you can chose one at random, pick one form the list below, or type the name or hex code above.
              </Form.Text>
              <GithubPicker
                width={ '100%' }
                color={ color }
                triangle={ 'hide' }
                onChangeComplete={ handleColorPickerChangeComplete }
                //   https://casesandberg.github.io/react-color/
                colors={ colorNamesList }
              />
            </Col>
          </Row>
        </Form.Group>
        <Button variant="primary" onClick={ handleSave } >
          Save
        </Button>
      </Form>
    </>
  );

};

LabelForm.propTypes = {
  color: PropTypes.any,
  label: PropTypes.any,
  description: PropTypes.any,
  labelId: PropTypes.any,
};

export default LabelForm;