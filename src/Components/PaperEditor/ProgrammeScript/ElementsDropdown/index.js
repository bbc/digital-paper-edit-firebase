import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faHeading,
  faMicrophoneAlt,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';

const ElementsDropdown = (props) => {
  const handleAdd = props.handleAdd;

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary">
        <FontAwesomeIcon icon={ faPlus } />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          onClick={ () => {
            handleAdd('title');
          } }
          title="Add a title header element to the programme script"
        >
          <FontAwesomeIcon icon={ faHeading } /> Heading
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ () => {
            props.handleAdd('voice-over');
          } }
          title="Add a title voice over element to the programme script"
        >
          <FontAwesomeIcon icon={ faMicrophoneAlt } /> Voice Over
        </Dropdown.Item>
        <Dropdown.Item
          onClick={ () => {
            props.handleAdd('note');
          } }
          title="Add a note element to the programme script"
        >
          <FontAwesomeIcon icon={ faStickyNote } /> Note
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>

  );
};

export default ElementsDropdown;
