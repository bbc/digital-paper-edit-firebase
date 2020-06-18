import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';

const withAuthentication = Component => {
  const WithAuthentication = props => {
    const [ popup, setPopup ] = useState(false);
    const [ authUser, setAuthUser ] = useState(
      JSON.parse(localStorage.getItem('authUser'))
    );

    const [ oidc, setOidc ] = useState(
      JSON.parse(localStorage.getItem('oidc'))
    );

    useEffect(() => {
      const oidcCall = async () => {
        try {
          const res = await this.auth.signInWithPopup(this.provider);
          console.log(res);
          if (res) {
            localStorage.setItem('oidc', JSON.stringify(res));
            setOidc(res);
          } else {
            console.log('failed');
            localStorage.removeItem('oidc');
            setOidc(null);
          }
        } catch (err) {
          console.log('failed with error', err);
        }
      };
        // await props.firebase.onOIDCAuthListener(
        //   res => {
        //     localStorage.setItem('oidc', JSON.stringify(res));
        //     setOidc(res);
        //   },
        //   (err) => {
        //     console.log('fallback oidc', err);
        //     throw (err);
        //     localStorage.removeItem('oidc');
        //     setOidc(null);
        //   }
      // }
      // let listener;
      // if (!popup) {
      //   setPopup(true);
      //   listener = props.firebase.onOIDCAuthListener(
      //     res => {
      //       localStorage.setItem('oidc', JSON.stringify(res));
      //       setOidc(res);
      //     },
      //     (err) => {
      //       console.log('fallback oidc', err);
      //       throw (err);
      //       localStorage.removeItem('oidc');
      //       setOidc(null);
      //     }
        // );

      if (!popup) {
        oidcCall();
        setPopup(false);
      }
      // }

      return () => {
        // if (listener) {
        //   console.log(listener);
        // listener();
        // }
      };
    }, [ props.firebase, popup ]);

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
      <AuthUserContext.Provider authUser={ authUser } oidc={ oidc }>
        <Component { ...props } />
      </AuthUserContext.Provider>
    );
  };

  WithAuthentication.propTypes = {
    firebase: PropTypes.shape({
      onAuthUserListener: PropTypes.func,
      onOIDCAuthListener: PropTypes.func
    })
  };

  return withFirebase(WithAuthentication);
};

export default withAuthentication;
