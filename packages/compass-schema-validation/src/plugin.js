import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import CompassSchemaValidation from 'components/compass-schema-validation';

/**
 * CompassSchemaValidationPlugin plugin.
 */
class Plugin extends Component {
  static displayName = 'CompassSchemaValidationPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <CompassSchemaValidation />
      </Provider>
    );
  }
}

export default Plugin;
