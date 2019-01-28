import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CompassSchema from 'components/compass-schema';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'CompassSchemaPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CompassSchema />
      </Provider>
    );
  }
}

export default Plugin;
