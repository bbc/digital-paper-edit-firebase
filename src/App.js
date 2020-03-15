import React, { useState, useEffect } from 'react';
import 'bootstrap-css-only/css/bootstrap.css';
import CustomAlert from '@bbc/digital-paper-edit-react-components/CustomAlert';
import Container from 'react-bootstrap/Container';
import Routes from './Routes';
import SignOutButton from './Components/SignOut';
import { withAuthentication } from './Components/Session';

const App = props => {
  let offlineWarning = null;
  const [ authUser, setAuthUser ] = useState();

  useEffect(() => {
    const authListener = props.firebase.auth.onAuthStateChanged(user =>
      setAuthUser(user)
    );

    return () => {
      authListener();
    };
  }, [ props.firebase.auth ]);

  if (!navigator.onLine) {
    offlineWarning = (
      <>
        <br />
        <Container>
          <CustomAlert
            variant={ 'warning' }
            heading={ 'Offline warning' }
            message={ "You don't seem to be connected to the internet " }
          />
        </Container>
      </>
    );
  }

  let AppContainer;

  if (authUser) {
    AppContainer = (
      <>
        <Container style={ { marginBottom: '2em', marginTop: '1em' } }>
          <h1> Digital Paper Edit </h1>
          <p>Signed in as: {authUser.email}</p>
          <SignOutButton />
        </Container>
        <Routes authUser={ authUser } />
      </>
    );
  } else {
    AppContainer = (
      <>
        <Container style={ { marginBottom: '2em', marginTop: '1em' } }>
          <h1> Digital Paper Edit </h1>
          <p>Please <a href="/">sign in</a> - please request a user and password</p>
        </Container>
        <Routes />
      </>
    );
  }

  return (
    <>
      {AppContainer}
    </>
  );
};

export default withAuthentication(App);
