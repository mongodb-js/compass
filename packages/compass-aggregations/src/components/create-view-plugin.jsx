import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import CreateViewModal from 'components/create-view-modal';

class CreateViewPlugin extends Component {
  static displayName = 'CreateViewPlugin';
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
        <CreateViewModal />
      </Provider>
    );
  }
}

export default CreateViewPlugin;
