import React, { Component } from 'react';
import { Provider } from 'react-redux';

import Databases from './components/databases';
import store from './stores/databases-store';

class Plugin extends Component {
  static displayName = 'DatabasesPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Databases />
      </Provider>
    );
  }
}

export default Plugin;
