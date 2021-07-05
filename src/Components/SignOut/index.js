import React from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import { withFirebase } from '../Firebase';

const SignOutButton = ({ firebase }) => {
  const { trackEvent } = useMatomo();

  const handleClick = () => {
    firebase.doSignOut();
    trackEvent({ category: 'global', action: 'click', name: 'sign out' });
  };

  return (
    <Button type="button" onClick={ handleClick }>
      Sign Out
    </Button>
  );
};

SignOutButton.propTypes = {
  firebase: PropTypes.any,
};

SignOutButton.propTypes = {
  firebase: PropTypes.shape({
    doSignOut: PropTypes.func
  })
};

export default withFirebase(SignOutButton);
