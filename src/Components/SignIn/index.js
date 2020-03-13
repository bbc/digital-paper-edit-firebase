import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
const SignInPage = () => (
  <div>
    <h2>Sign In</h2>
    <SignInForm />
  </div>
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

  const onChange = event => {
    if (event.target.name === 'password') {
      setPassword(event.target.value);
    } else {
      setEmail(event.target.value);
    }
  };

  const isInvalid = password === '' || email === '';

  return (
    <form onSubmit={ onSubmit }>
      <input
        name="email"
        value={ email }
        onChange={ onChange }
        type="text"
        placeholder="Email Address"
      />
      <input
        name="password"
        value={ password }
        onChange={ onChange }
        type="password"
        placeholder="Password"
      />
      <button disabled={ isInvalid } type="submit">
        Sign In
      </button>

      {error && <p>{error.message}</p>}
    </form>
  );
};

// HOC with router and firebase
const SignInForm = compose(withRouter, withFirebase)(SignInFormBase);

export default SignInPage;

export { SignInForm };
