import React, { Component } from 'react';
import { Provider } from 'react-redux';
import DropCollectionModal from 'components/drop-collection-modal';
import store from 'stores/drop-collection';

class DropCollectionPlugin extends Component {
  static displayName = 'DropCollectionPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <DropCollectionModal />
      </Provider>
    );
  }
}

export default DropCollectionPlugin;
