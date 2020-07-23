import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const UserForm = (props) => {

  const [ validated, setValidated ] = useState(false);

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');

  const onPasswordChange = event => {
    setPassword(event.target.value);
  };

  const onEmailChange = event => {
    setEmail(event.target.value);
  };

  const isInvalid = password === '' || email === '';

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    setValidated(true);
    props.handleSubmit(email, password);
  };

  return (
    <>
      <Form noValidate validated={ validated } onSubmit={ handleSubmit }>
        <Form.Group controlId="formBasicEmail">
          <Form.Label >Email address</Form.Label>
          <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
          <Form.Text className="text-muted">
          </Form.Text>
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control value={ password } onChange={ onPasswordChange } type="password" placeholder="Password" />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={ isInvalid }>
          Submit
        </Button>
      </Form>
    </>
  );
};

UserForm.propTypes = {
  handleSubmit: PropTypes.func
};

export default UserForm;