import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from '@mongodb-js/compass-components';

import CompassSchema from './components/compass-schema';

class Plugin extends Component {
  static displayName = 'CompassSchemaPlugin';

  static propTypes = {
    store: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={this.props.store}>
        <CompassSchema {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
