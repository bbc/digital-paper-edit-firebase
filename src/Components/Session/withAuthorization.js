import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

// with Authorization called before each route
const withAuthorization = condition => Component => {

  const WithAuthorization = props => {
    const [ oidc, setoidc ] = useState();

    useEffect(() => {
      if (!oidc) {
        setoidc(props.firebase.onOIDCAuthListener());
      }

      return () => {
      };
    }, [ oidc, props.firebase ]);

    useEffect(() => {
      let listener;

      if (oidc) {
        listener = props.firebase.onAuthUserListener(
          authUser => {
            if (!condition(authUser)) {
              console.log('not authorised');
              props.history.push(ROUTES.SIGN_IN);
            }
          },
          () => props.history.push(ROUTES.SIGN_IN)
        );
      }

      return () => {
        listener();
      };
    }, [ props.firebase, props.history, oidc ]);

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
