import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from '@shakacode/recompose';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

const PasswordResetPage = () => (
  <Container style={ { marginBottom: '5em', marginTop: '1em', border: '1px solid #6b6b6b', width: '398px', height: '354px', padding: '1.5em', position: 'relative' } }>
    <h2 style={ { marginBottom: '0.5em' } }>Password reset</h2>
    <PasswordResetForm />
  </Container>
);

const PasswordResetFormBase = props => {

  const [ email, setEmail ] = useState('');
  const [ error, setError ] = useState();

  const onSubmit = async event => {
    // Prevent form from reloading
    event.preventDefault();

    try {
      await props.firebase.doSignInWithEmailAndPassword(email);
      props.history.push(ROUTES.PROJECTS);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  const onEmailChange = event => {
    setEmail(event.target.value);
  };

  const isInvalid = email === '';

  return (
    <Form onSubmit={ onSubmit }>
      <Form.Row>
        <Col>
          <Form.Group controlId="email" >
            <Form.Label>Email address</Form.Label>
            <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
          </Form.Group>
        </Col>
      </Form.Row>
      <Button
        style={ { position: 'absolute', bottom: '4em' } }
        disabled={ isInvalid }
        variant="primary"
        type="submit">
        Send password reset email
      </Button>
      {error && <p>{error.message}</p>}
    </Form>
  );
};

PasswordResetFormBase.propTypes = {
  firebase: PropTypes.shape({
    doSignInWithEmailAndPassword: PropTypes.func
  }),
  history: PropTypes.shape({
    push: PropTypes.func
  })
};

// HOC with router and firebase
const PasswordResetForm = compose(withRouter, withFirebase)(PasswordResetFormBase);

export default PasswordResetPage;
