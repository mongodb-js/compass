import React, { Component } from 'react';
import { Provider } from 'react-redux';

import CollectionsPlugin from './components/collections';
import store from './stores/collections-store';

class Plugin extends Component {
  static displayName = 'CollectionsPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CollectionsPlugin />
      </Provider>
    );
  }
}

export default Plugin;
