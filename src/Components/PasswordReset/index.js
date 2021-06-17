import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from '@shakacode/recompose';
import { withFirebase } from '../Firebase';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
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
  const [ isInvalid, setIsInvalid ] = useState(true);

  const onSubmit = async event => {
    event.preventDefault();
    setError(undefined);

    try {
      await props.firebase.doPasswordReset(email);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (resetError) {
      setError(resetError);
      setIsInvalid(true);
      console.error(resetError);
    }
  };

  const onEmailChange = event => {
    setEmail(event.target.value);

    if (event.target.value === '') {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }

    if (error) {
      setError(undefined);
    }
  };

  const renderErrorAlert = () => {
    const notFoundError = (
      <>
        Sorry, we can’t find an account with that email. You can contact {' '}
        <Alert.Link href='mailto:dpe@bbcnewslabs.co.uk'>dpe@bbcnewslabs.co.uk</Alert.Link> for a new account or support.
      </>
    );

    return (
      <Alert variant='danger' style={ { fontSize: '12px', padding: '8px', marginTop: '8px' } }>
        {error.code === 'auth/user-not-found' ? notFoundError : error.message}
      </Alert>
    );
  };

  return (
    <Form onSubmit={ onSubmit }>
      <Form.Row>
        <Col>
          <Form.Group controlId="email" >
            <Form.Label>Email address</Form.Label>
            <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
            { error ? renderErrorAlert() : null }
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
    </Form>
  );
};

PasswordResetFormBase.propTypes = {
  firebase: PropTypes.shape({
    doPasswordReset: PropTypes.func
  })
};

// HOC with router and firebase
const PasswordResetForm = compose(withRouter, withFirebase)(PasswordResetFormBase);

export default PasswordResetPage;
