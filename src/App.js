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
import Collection from './Components/Firebase/Collection';

const App = (props) => {
  let offlineWarning = null;
  const [ authUser, setAuthUser ] = useState();
  const [ user, setUser ] = useState();

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const authListener = props.firebase.auth.onAuthStateChanged((user) =>
      setAuthUser(user)
    );

    return () => {
      authListener();
    };
  }, [ props.firebase.auth ]);

  useEffect(() => {
    const userCollection = new Collection(props.firebase, '/users');
    const getUser = async () => {
      const userItem = await userCollection.getItem(authUser.uid);
      setUser(userItem);
    };

    if (authUser) {
      getUser();
    }

    return () => {
    };
  }, [ props.firebase, authUser ]);

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
              <strong>
                {user && user.role === 'ADMIN' ? <a href="#admin">{authUser.email}</a> : authUser.email}
              </strong>
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
          <Row>
            <Col xs={ 5 }>
              <h1> Digital Paper Edit </h1>
            </Col>
            <Col md={ { offset: 1, span: 3 } }>
              Please <a href="/">sign in</a> or request login details by clicking the help button!
            </Col>
            <Col md={ { span: 3 } }>
              <HelpOverlayTrigger />
            </Col>
          </Row>
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
