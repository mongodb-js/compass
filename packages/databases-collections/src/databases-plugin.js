import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import Databases from './components/databases';
// import store from './stores/databases-store';

class Plugin extends Component {
  static displayName = 'DatabasesPlugin';

  static propTypes = {
    store: PropTypes.object.isRequired,
    updateNamespace: PropTypes.func.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    console.log('render databases plugin store:', this.props.store);
    return (
      <Provider store={this.props.store}>
        <Databases
          updateNamespace={this.props.updateNamespace}
        />
      </Provider>
    );
  }
}

export default Plugin;
