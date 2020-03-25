import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

const SignInPage = () => (
  <Container style={ { marginBottom: '5em', marginTop: '1em' } }>
    <h2>Sign In</h2>
    <SignInForm />
  </Container>
);

const SignInFormBase = props => {

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ error, setError ] = useState();

  const onSubmit = async event => {
    // Prevent form from reloading
    event.preventDefault();

    try {
      await props.firebase.doSignInWithEmailAndPassword(email, password);
      props.history.push(ROUTES.PROJECTS);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  const onPasswordChange = event => {
    setPassword(event.target.value);
  };

  const onEmailChange = event => {
    setEmail(event.target.value);
  };

  const isInvalid = password === '' || email === '';

  return (
    <Form onSubmit={ onSubmit }>
      <Form.Row>
        <Col>
          <Form.Group controlId="email" >
            <Form.Label>Email address</Form.Label>
            <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="password" >
            <Form.Label>Password</Form.Label>
            <Form.Control value={ password } onChange={ onPasswordChange } type="password" placeholder="Password" />
          </Form.Group>
        </Col>
      </Form.Row>
      <Button
        disabled={ isInvalid }
        variant="primary" type="submit">
          Sign in
      </Button>
      {error && <p>{error.message}</p>}
    </Form>
  );
};

// HOC with router and firebase
const SignInForm = compose(withRouter, withFirebase)(SignInFormBase);

export default SignInPage;

export { SignInForm };
