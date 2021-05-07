import React, { Component } from 'react';
import { Provider } from 'react-redux';
import TestPlugin from './component';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'TestPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <TestPlugin />
      </Provider>
    );
  }
}

export default Plugin;
