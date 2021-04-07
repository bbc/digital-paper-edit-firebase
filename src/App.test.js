import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import Firebase, { FirebaseContext } from './Components/Firebase';

test('App renders', () => {
  render(
    <FirebaseContext.Provider value={ new Firebase() }>
      <App />
    </FirebaseContext.Provider>
  );
  expect(screen.getByText('Digital Paper Edit')).toBeTruthy();
});
