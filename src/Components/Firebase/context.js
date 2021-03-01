import React from 'react';

const FirebaseContext = React.createContext(null);
export default FirebaseContext;

export const withFirebase = Component => {

  const WithFirebase = (props) => (
    <FirebaseContext.Consumer>
      {firebase => <Component { ...props } firebase={ firebase } />}
    </FirebaseContext.Consumer>
  );

  return WithFirebase;
};
