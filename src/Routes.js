import PropTypes from 'prop-types';
import React from 'react';
import Projects from './Components/Projects/index.js';
import Workspace from './Components/Workspace';
import TranscriptEditor from './Components/Workspace/Transcripts/TranscriptEditor.js';
import PaperEditor from './Components/PaperEditor';
import Admin from './Components/Admin';
import { Switch, Route, HashRouter } from 'react-router-dom';
import SignIn from './Components/SignIn';
import * as ROUTES from './constants/routes';

const PageNotFound = () => {
  return (
    <div>
      <h1>404 Page Not Found</h1>
      <p>There was an error loading the page you requested!</p>
    </div>
  );
};

const Routes = ({ authUser }) => {

  const landingRoute = () => {
    if (!!authUser) {
      return <Route exact path={ ROUTES.LANDING } component={ Projects } />;
    } else {
      return <Route exact path={ ROUTES.LANDING } component={ SignIn } />;
    }
  };

  return (
    <HashRouter basename="/">
      <Switch>
        {landingRoute()}
        <Route exact path={ ROUTES.SIGN_IN } component={ SignIn } />
        <Route exact path={ ROUTES.PROJECTS } component={ Projects } />
        <Route exact path={ ROUTES.WORKSPACE } component={ Workspace } />
        <Route exact path={ ROUTES.PAPER_EDITOR } component={ PaperEditor } />
        <Route
          exact
          path={ ROUTES.TRANSCRIPT_EDITOR_CORRECT }
          component={ TranscriptEditor }
        />
        <Route
          exact
          path={ ROUTES.TRANSCRIPT_EDITOR }
          component={ TranscriptEditor }
        />
        <Route exact path={ ROUTES.ADMIN } component={ Admin } />
        <Route component={ PageNotFound } />
      </Switch>
    </HashRouter>
  );
};

Routes.propTypes = {
  authUser: PropTypes.any
};

export default Routes;
