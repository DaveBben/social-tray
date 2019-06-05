import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HackerNews from './components/HackerNews';
import Reddit from './components/Reddit';
import Navbar from './components/Navbar';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.HN} component={HackerNews} />
      <Route path={routes.REDDIT} component={Reddit} />
      <Route component={HackerNews} />
    </Switch>
    <Navbar />

  </App>
);
