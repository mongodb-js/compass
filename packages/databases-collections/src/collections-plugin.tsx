import React, { Component } from 'react';
import { Provider } from 'react-redux';

import CollectionsPlugin from './components/collections';
import store from './stores/collections-store';

class Plugin extends Component<{
  // TODO: not currently used, but will be when the plugin is converted to the
  // new interface
  namespace: string;
}> {
  static displayName = 'CollectionsPlugin';

  /**
   * Connect the Plugin to the store and render.
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
