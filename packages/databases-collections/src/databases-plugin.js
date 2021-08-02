import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import Databases from './components/databases';
// import store from './stores/databases-store';

class Plugin extends Component {
  static displayName = 'DatabasesPlugin';

  propTypes = {
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
        <Databases />
      </Provider>
    );
  }
}

export default Plugin;
