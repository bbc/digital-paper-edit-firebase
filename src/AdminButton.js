import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import React from 'react';

const AdminButton = () => {

  return (
    <Button variant="success">
      <FontAwesomeIcon icon={ faQuestionCircle } /> Admin
    </Button>
  );
};

export default AdminButton;
