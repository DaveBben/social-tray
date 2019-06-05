// @flow
import React, { Component } from 'react';
import ReactPullToRefresh from 'react-pull-to-refresh';
import styles from './Reddit.css';
import API_URLS from '../constants/api';
import './Refresh.css';

const Store = require('electron-store');

let store = null;

const clientID = '9s9ELesX6kP6_Q';
const secret = 'ZBCT0hQ4rJZpxcCrpBX_5YZgJ-w';

type Post = {
  title: string,
  comments: number,
  image: string,
  score: number,
  time: number,
  externalURL: string,
  url: string
};

type State = {
  posts: Array<Post>,
  subreddit: String
};

export default class Reddit extends Component<State> {
  state = {
    posts: [],
    subreddit: 'all',
    sort: 'hot'
  };

  componentDidMount() {
    store = new Store();
    console.log(store.get('reddit'));
    if (!store.get('reddit_posts')) {
      this.grabPosts(this.state.subreddit);
    } else {
      console.log('loading from cache');
      this.setState({ posts: store.get('reddit_posts') });
    }
  }

  refresh = () => {
    if (!store.get('reddit') || !this.validToken()) {
      this.getAccessToken();
    } else {
      this.grabPosts(this.state.subreddit);
    }
  };

  validToken = () => {
    if (!store.get('reddit')) {
      return false;
    }

    const currentDate = new Date();
    const expires = new Date(store.get('reddit').expires);
    const difference = expires.getTime() - currentDate.getTime();
    const minutesDifference = Math.ceil(difference / (1000 * 60)); // minutes difference
    console.log(minutesDifference);
    if (minutesDifference < 5) {
      return false;
    }
    return true;
  };

  getAccessToken = async () => {
    console.log('grabbing new token');
    const formData = new FormData();
    formData.append('grant_type', 'client_credentials');
    const config = await fetch(API_URLS.REDDIT_APPLICATION_URL, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Basic ${btoa(`${clientID}:` + `${secret}`)}`
      }
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
        return json;
      })
      .catch(err => console.log(err));
    store.set('reddit', {
      token: config.access_token,
      expires: new Date().addHours(config.expires_in / 3600)
    });
    this.grabPosts(this.state.subreddit);
  };

  grabPosts = async subbreddit => {
    const posts = await fetch(
      `${API_URLS.REDDIT_URL}${subbreddit}/${this.state.sort}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${store.get('reddit').token}`
        }
      }
    )
      .then(data => data.json())
      .then(redditItems => {
        console.log(redditItems.data.children);
        return redditItems.data.children;
      })
      .catch(err => console.log(err));
    const redditPosts: Array<Post> = [];
    posts.forEach(i => {
      const element = i.data;
      const p: Post = {};
      p.title = element.title;
      p.score = element.score;
      p.comments = element.num_comments;
      p.image = element.thumbnail;
      p.time = element.created;
      p.externalURL = element.url;
      p.url = element.permalink;
      redditPosts.push(p);
    });
    this.setState({ posts: redditPosts });
    store.set('reddit_posts', redditPosts);
  };

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <ul>
          <ReactPullToRefresh loading onRefresh={this.refresh}>
            {this.state.posts.map(story => {
              return (
                <React.Fragment>
                  <li className={styles.article}>{story.title}</li>
                  <hr />
                </React.Fragment>
              );
            })}
          </ReactPullToRefresh>
        </ul>
      </div>
    );
  }
}

// Adding hours to the current date
// source: https://stackoverflow.com/questions/1050720/adding-hours-to-javascript-date-object
Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
