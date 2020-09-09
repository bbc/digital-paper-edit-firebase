import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import BSForm from 'react-bootstrap/Form';

const Form = (props) => {

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
      <BSForm noValidate validated={ validated } onSubmit={ handleSubmit }>
        <BSForm.Group controlId="formBasicEmail">
          <BSForm.Label >Email address</BSForm.Label>
          <BSForm.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
          <BSForm.Text className="text-muted">
          </BSForm.Text>
        </BSForm.Group>

        <BSForm.Group controlId="formBasicPassword">
          <BSForm.Label>Password</BSForm.Label>
          <BSForm.Control value={ password } onChange={ onPasswordChange } type="password" placeholder="Password" />
        </BSForm.Group>

        <Button variant="primary" type="submit" disabled={ isInvalid }>
          Submit
        </Button>
      </BSForm>
    </>
  );
};

Form.propTypes = {
  handleSubmit: PropTypes.func
};

export default Form;