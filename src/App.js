import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import 'bootstrap-css-only/css/bootstrap.css';
import Container from 'react-bootstrap/Container';
import Routes from './Routes';
import SignOutButton from './Components/SignOut';
import { withAuthentication } from './Components/Session';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import HelpOverlayTrigger from './HelpOverlayTrigger';

const App = (props) => {
  let offlineWarning = null;
  const [ authUser, setAuthUser ] = useState();

  useEffect(() => {
    const authListener = props.firebase.auth.onAuthStateChanged((user) =>
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
          <Alert variant={ 'warning' }>
            <Alert.heading>Offline warning</Alert.heading>
            You don`&apos;`t seem to be connected to the internet
          </Alert>
        </Container>
      </>
    );
  }

  let AppContainer;

  if (authUser) {
    AppContainer = (
      <>
        {offlineWarning}
        <Container style={ { marginBottom: '1em', marginTop: '1em' } }>
          <Row>
            <Col xs={ 5 }>
              <h1> Digital Paper Edit </h1>
            </Col>
            <Col md={ { offset: 1, span: 3 } }>
              Signed in as: <br></br>
              <strong>{authUser.email}</strong>
            </Col>
            <Col md={ { span: 3 } }>
              <SignOutButton /> <HelpOverlayTrigger />
            </Col>
          </Row>
        </Container>
        <Routes authUser={ authUser } />
      </>
    );
  } else {
    AppContainer = (
      <>
        <Container style={ { marginBottom: '2em', marginTop: '1em' } }>
          <h1> Digital Paper Edit </h1>
          <p>
            Please <a href="/">sign in</a> - please request a user and password
          </p>
        </Container>
        <Routes />
      </>
    );
  }

  return <>{AppContainer}</>;
};

App.propTypes = {
  firebase: PropTypes.shape({
    auth: PropTypes.shape({
      onAuthStateChanged: PropTypes.func,
    }),
  }),
};

export default withAuthentication(App);
