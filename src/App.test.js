import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import Firebase, { FirebaseContext } from './Components/Firebase';

test('App renders', async () => {
  render(
    <FirebaseContext.Provider value={ new Firebase() }>
      <App />
    </FirebaseContext.Provider>
  );

  await waitFor(() => expect(screen.getByText('Digital Paper Edit')).toBeTruthy());
});