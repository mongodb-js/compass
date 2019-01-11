import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Database from 'components/database';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'DatabasePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Database />
      </Provider>
    );
  }
}

export default Plugin;
