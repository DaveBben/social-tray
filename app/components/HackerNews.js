// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './HackerNews.css';
import API_URLS from '../constants/api';

type Props = {};

type Story = {
  by: string,
  descendants: number,
  id: number,
  kids: Array<number>,
  score: number,
  time: number,
  title: string,
  type: string,
  url: string
};

type State = {
  stories: Array<Story>
};

export default class HackerNews extends Component<Props, State> {
  props: Props;

  state = {
    stories: []
  };

  componentDidMount() {
    const storyPromises = fetch(API_URLS.HN_TOP)
      .then(response => response.json())
      .then((json: Array<number>) => {
        const sectionOfStories = json.slice(0, 51);
        const promises: Array<Promise<any>> = [];
        sectionOfStories.forEach(id => {
          const promise: Promise<any> = new Promise((resolve, reject) => {
            fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`
            )
              .then(data => resolve(data.json()))
              .catch(err => reject(err));
          });
          promises.push(promise);
        });
        return Promise.all(promises);
      })
      .catch(err => console.log(err));

    storyPromises
      .then(data => {
        return this.setState({ stories: data });
      })
      .catch(error => {
        console.log(error);
        return new Error('Could not retrieve stories');
      });
  }

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <ul>
          {this.state.stories.map(story => {
            return (
              <React.Fragment>
                <li className={styles.article}>{story.title}</li>
                <hr />
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    );
  }
}
