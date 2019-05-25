// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Navbar.css';

type Props = {};
class Navbar extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <Link to={routes.HN}>Hacker News</Link>
        <Link to={routes.REDDIT}>Reddit</Link>
        <Link to={routes.TWITTER}>Twitter</Link>
      </div>
    );
  }
}

export default Navbar;
