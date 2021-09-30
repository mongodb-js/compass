import React, { Component } from 'react';
import { Provider } from 'react-redux';

import Sidebar from './components/sidebar';
import store from './stores';

class Plugin extends Component {
  static displayName = 'SidebarPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );
  }
}

export default Plugin;
