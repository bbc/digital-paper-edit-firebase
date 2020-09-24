import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import { UsersCollection } from '../Firebase/Collections';

// with Authorization called before each route
const withAuthorization = condition => Component => {

  const WithAuthorization = props => {
    const [ loading, setLoading ] = useState(false);
    const [ collections, setCollections ] = useState();

    const buildCollections = async () => {
      setLoading(true);
      const userCollections = await UsersCollection.build(props.firebase);
      setCollections(userCollections);
      setLoading(false);
    };

    useEffect(() => {

      const listener = props.firebase.onAuthUserListener(
        authUser => {
          if (!condition(authUser)) {
            props.history.push(ROUTES.SIGN_IN);
          } else {
            if (!loading && !collections) {
              buildCollections();
            }
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
        {authUser => (condition(authUser) ?
          <Component { ...props } collections={ collections } /> : null)}
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
