import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

// with Authorization called before each route
const withAuthorization = condition => Component => {

  const WithAuthorization = props => {

    useEffect(() => {
      const listener = props.firebase.onAuthUserListener(
        authUser => {
          if (!condition(authUser)) {
            props.history.push(ROUTES.SIGN_IN);
          }
        },
        () => props.history.push(ROUTES.SIGN_IN)
      );

      return () => {
        listener();
      };
    }, [ props.firebase, props.history ]);

    return (
      <AuthUserContext.Consumer>
        {authUser => (condition(authUser) ? <Component { ...props } /> : null)}
      </AuthUserContext.Consumer>
    );
  };

  WithAuthorization.propTypes = {
    firebase: PropTypes.any,
    history: PropTypes.any
  };

  return compose(withRouter, withFirebase)(WithAuthorization);
};

export default withAuthorization;
