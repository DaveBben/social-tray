import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HackerNews from './components/HackerNews';
import Navbar from './components/Navbar';

export default () => (
  <App>
    <Switch>
      <Route path={routes.HN} component={HackerNews} />
    </Switch>
    <Navbar />

  </App>
);
