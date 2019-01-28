import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CreateCollectionModal from 'components/create-collection-modal';
import store from 'stores/create-collection';

class CreateCollectionPlugin extends Component {
  static displayName = 'CreateCollectionPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CreateCollectionModal />
      </Provider>
    );
  }
}

export default CreateCollectionPlugin;
