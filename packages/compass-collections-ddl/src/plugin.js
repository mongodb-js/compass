import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Ddl from 'components/ddl';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'DdlPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Ddl />
      </Provider>
    );
  }
}

export default Plugin;
