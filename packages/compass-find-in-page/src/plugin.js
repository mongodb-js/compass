import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CompassFindInPage from 'components/compass-find-in-page';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'CompassFindInPagePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CompassFindInPage />
      </Provider>
    );
  }
}

export default Plugin;
