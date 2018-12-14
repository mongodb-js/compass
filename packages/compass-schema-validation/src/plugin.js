import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CompassSchemaValidation from 'components/compass-schema-validation';
import store from 'stores';

/**
 * CompassSchemaValidationPlugin plugin.
 */
class Plugin extends Component {
  static displayName = 'CompassSchemaValidationPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CompassSchemaValidation />
      </Provider>
    );
  }
}

export default Plugin;
