import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import CreateIndexModal from './components/create-index-modal';

class CreateIndexPlugin extends Component {
  static displayName = 'CreateIndexPlugin';
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
        <CreateIndexModal />
      </Provider>
    );
  }
}

export default CreateIndexPlugin;
