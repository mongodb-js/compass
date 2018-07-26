import React, { Component } from 'react';
import { Provider } from 'react-redux';
import AutoUpdate from 'components/auto-update';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'AutoUpdatesPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <AutoUpdate />
      </Provider>
    );
  }
}

export default Plugin;
