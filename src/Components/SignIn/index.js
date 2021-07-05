import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { compose } from '@shakacode/recompose';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import './index.scss';

const SignInPage = () => (
  <Container className='SignIn__container'>
    <h2 className='SignIn__header'>Sign In</h2>
    <SignInForm />
  </Container>
);

const SignInFormBase = props => {
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ error, setError ] = useState();

  const { trackEvent } = useMatomo();

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
    <>
      <Form className='SignIn__form' onSubmit={ onSubmit }>
        <Form.Row>
          <Col>
            <Form.Group controlId="email" >
              <Form.Label>Email address</Form.Label>
              <Form.Control value={ email } onChange={ onEmailChange } type="email" placeholder="Enter email" />
            </Form.Group>
          </Col>
        </Form.Row>
        <Form.Row>
          <Col>
            <Form.Group controlId="password" >
              <Form.Label>Password</Form.Label>
              <Form.Control value={ password } onChange={ onPasswordChange } type="password" placeholder="Password" />
            </Form.Group>
          </Col>
        </Form.Row>
        <Button
          disabled={ isInvalid }
          variant="primary"
          type="submit"
          onClick={ () => trackEvent({ category: 'sign in page', action: 'click', name: 'sign in' }) }
        >
          Sign in
        </Button>
        {error && <p>{error.message}</p>}
      </Form>
      <Link to={ { pathname: '/reset', search: `?email=${ email }` } } className='SignIn__link'>
        Password reset
      </Link>
    </>
  );
};

SignInFormBase.propTypes = {
  firebase: PropTypes.shape({
    doSignInWithEmailAndPassword: PropTypes.func
  }),
  history: PropTypes.shape({
    push: PropTypes.func
  })
};

// HOC with router and firebase
const SignInForm = compose(withRouter, withFirebase)(SignInFormBase);

export default SignInPage;
