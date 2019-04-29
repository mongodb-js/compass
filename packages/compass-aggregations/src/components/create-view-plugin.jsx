import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CreateViewModal from 'components/create-view-modal';
import store from 'stores/create-view';

class CreateViewPlugin extends Component {
  static displayName = 'CreateViewPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CreateViewModal />
      </Provider>
    );
  }
}

export default CreateViewPlugin;
