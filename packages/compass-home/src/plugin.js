import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Home from 'components/home';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'HomePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Home />
      </Provider>
    );
  }
}

export default Plugin;
