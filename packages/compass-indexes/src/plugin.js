import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Indexes from 'components/indexes';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'IndexesPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Indexes />
      </Provider>
    );
  }
}

export default Plugin;
