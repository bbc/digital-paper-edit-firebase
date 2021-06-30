import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { compose } from '@shakacode/recompose';
import { withFirebase } from '../Firebase';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import './index.scss';

const PasswordResetPage = () => (
  <Container className='PasswordReset__container'>
    <PasswordResetForm />
  </Container>
);

const PasswordResetFormBase = ({ firebase, location: { search } }) => {
  const params = new URLSearchParams(search);
  const emailParam = params.get('email') || '';

  const [ email, setEmail ] = useState(emailParam);
  const [ error, setError ] = useState();
  const [ isValid, setIsValid ] = useState(emailParam.length > 0);
  const [ isSubmitted, setIsSubmitted ] = useState(false);

  const onSubmit = async event => {
    event.preventDefault();
    setError(undefined);

    try {
      await firebase.doPasswordReset(email);
      window.localStorage.setItem('emailForSignIn', email);
      setIsSubmitted(true);
    } catch (resetError) {
      setError(resetError);
      setIsValid(false);
      console.error(resetError);
    }
  };

  const onEmailChange = event => {
    setEmail(event.target.value);

    if (event.target.value === '') {
      setIsValid(false);
    } else {
      setIsValid(true);
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
      <Alert variant='danger' className='PasswordReset__error'>
        {error.code === 'auth/user-not-found' ? notFoundError : error.message}
      </Alert>
    );
  };

  const renderForm = () => (
    <>
      <h2 className='PasswordReset__header'>Password reset</h2>
      <Form onSubmit={ onSubmit }>
        <Form.Row>
          <Col>
            <Form.Group controlId="email" >
              <Form.Label>Email address</Form.Label>
              <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" isInvalid={ !!error } />
              { error ? renderErrorAlert() : null }
            </Form.Group>
          </Col>
        </Form.Row>
        <Button
          className='PasswordReset__submit'
          disabled={ !isValid }
          variant="primary"
          type="submit">
          Send password reset email
        </Button>
      </Form>
    </>
  );

  const renderSuccessMessage = () => (
    <div>
      <h2 className='PasswordReset__header'>Password reset successful</h2>
      <p>
        Please check your inbox.<br />
        We’ve just sent a reset link for your password.<br />
        It may take a few minutes to arrive.
      </p>
      <p>Can’t find it? Check your spam folder.</p>
      <p>
        <Link to={ { pathname: '/reset', search: `?email=${ email }` } } className='PasswordReset__link'
          onClick={ () => setIsSubmitted(false) }>
          Or resend the email.
        </Link>
      </p>
    </div>
  );

  return isSubmitted ? renderSuccessMessage() : renderForm();
};

PasswordResetFormBase.propTypes = {
  firebase: PropTypes.shape({
    doPasswordReset: PropTypes.func
  })
};

// HOC with router and firebase
const PasswordResetForm = compose(withRouter, withFirebase)(PasswordResetFormBase);

export default PasswordResetPage;
