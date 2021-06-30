import React from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { withFirebase } from '../Firebase';

const SignOutButton = ({ firebase }) => (
  <Button type="button" onClick={ firebase.doSignOut }>
    Sign Out
  </Button>
);

SignOutButton.propTypes = {
  firebase: PropTypes.shape({
    doSignOut: PropTypes.func
  })
};

export default withFirebase(SignOutButton);
