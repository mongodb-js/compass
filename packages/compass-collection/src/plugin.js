import React, { Component } from 'react';
import Workspace from 'components/workspace';
import { Provider } from 'react-redux';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'CollectionWorkspacePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Workspace />
      </Provider>
    );
  }
}

export default Plugin;
export { Plugin };
