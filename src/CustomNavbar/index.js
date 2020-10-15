import React, { useEffect } from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPhone, faCalendarAlt, faHeadphones, faFileAudio, faFileUpload, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Container from 'react-bootstrap/Container';
// import CustomNotice from '../CustomNotice';

function CustomNavbar(props) {
  const { firebase } = props;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        props.handleUserChange(true);
      } else {
        props.handleUserChange(false);
      }
      //   this.props.handleUserChange(user)
    });

    // https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1
    return function cleanup() {
      // TODO: add some clean up logic here for logout?
    };
  }, []);

  const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
    signInSuccessUrl: '/',
    // We will display Google and Facebook as auth providers.
    signInOptions: [firebase.auth ? firebase.auth.GoogleAuthProvider.PROVIDER_ID : null],
  };

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    hd: 'wsj.com',
  });

  return (
    <>
      <Navbar sticky="top" bg="light" expand="md">
        <Navbar.Brand href="/#">
          {' '}
          {/* <FontAwesomeIcon icon={faHeadphones} size="1x" /> */}
          Digital Paper Edit
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto"></Nav>
          <Nav>
            <Nav.Link href="#/projects">
              {/* <FontAwesomeIcon icon={faFileAudio} title="Projects" size="1x" />  */}
              Projects
            </Nav.Link>
          </Nav>
          <Nav>
            {firebase.auth().currentUser ? (
              <>
                <Nav.Link onClick={() => firebase.auth().signOut()} title={`sign out ${firebase.auth().currentUser.displayName}`}>
                  {' '}
                  {firebase.auth().currentUser.email} <FontAwesomeIcon icon={faSignOutAlt} />
                </Nav.Link>
              </>
            ) : (
              <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            )}
          </Nav>
          <></>
        </Navbar.Collapse>
      </Navbar>

      {navigator.onLine ? null : (
        <Container>
          <br />
          {/* <CustomNotice variant={'warning'} title={'Offline'} description={'You are offline'} /> */}
          You are offline
        </Container>
      )}
    </>
  );
}

export default CustomNavbar;
