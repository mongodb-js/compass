import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import DropIndexModal from './components/drop-index-modal';

class DropIndexPlugin extends Component {
  static displayName = 'DropIndexPlugin';
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
        <DropIndexModal />
      </Provider>
    );
  }
}

export default DropIndexPlugin;
