import React, { useEffect, useState } from 'react';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import PropTypes from 'prop-types';

const withAuthentication = Component => {
  const WithAuthentication = props => {
    const [ authUser, setAuthUser ] = useState(
      JSON.parse(localStorage.getItem('authUser'))
    );

    useEffect(() => {
      const listener = props.firebase.onAuthUserListener(
        user => {
          localStorage.setItem('authUser', JSON.stringify(user));
          setAuthUser(user);
        },
        () => {
          localStorage.removeItem('authUser');
          setAuthUser(null);
        }
      );

      return () => {
        listener();
      };
    }, [ props.firebase ]);

    return (
      <AuthUserContext.Provider value={ authUser }>
        <Component { ...props } />
      </AuthUserContext.Provider>
    );
  };

  WithAuthentication.propTypes = {
    firebase: PropTypes.any,
  };

  return withFirebase(WithAuthentication);
};

export default withAuthentication;
