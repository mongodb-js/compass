import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import Indexes from './components/indexes/indexes';

class Plugin extends Component {
  static displayName = 'IndexesPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <Indexes />
      </Provider>
    );
  }
}

export default Plugin;
