import React from 'react';
import Button from 'react-bootstrap/Button';

import { withFirebase } from '../Firebase';

const SignOutButton = ({ firebase }) => (
  <Button type="button" onClick={ firebase.doSignOut }>
    Sign Out
  </Button>
);

export default withFirebase(SignOutButton);
