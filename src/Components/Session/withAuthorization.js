import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import { withAnalytics } from '../Analytics';
import * as ROUTES from '../../constants/routes';

// with Authorization called before each route
const withAuthorization = condition => Component => {

  const WithAuthorization = props => {
    const { firebase, history, setAnalyticsUserId } = { ...props };

    useEffect(() => {
      const listener = firebase.onAuthUserListener(
        authUser => {
          if (!condition(authUser)) {
            history.push(ROUTES.SIGN_IN);
          } else {
            setAnalyticsUserId(`${ authUser.uid } ${ authUser.email }`);
          }
        },
        () => history.push(ROUTES.SIGN_IN)
      );

      return () => {
        listener();
      };
    }, [ firebase, history, setAnalyticsUserId, ]);

    return (
      <AuthUserContext.Consumer>
        {authUser => (condition(authUser) ? <Component { ...props } /> : null)}
      </AuthUserContext.Consumer>
    );
  };

  WithAuthorization.propTypes = {
    firebase: PropTypes.any,
    history: PropTypes.any,
    setAnalyticsUserId: PropTypes.func
  };

  return compose(withRouter, withFirebase, withAnalytics)(WithAuthorization);
};

export default withAuthorization;
