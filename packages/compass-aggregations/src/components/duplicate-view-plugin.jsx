import React, { Component } from 'react';
import { Provider } from 'react-redux';
import DuplicateViewModal from 'components/duplicate-view-modal';
import store from 'stores/duplicate-view';

class DuplicateViewPlugin extends Component {
  static displayName = 'DuplicateViewPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <DuplicateViewModal />
      </Provider>
    );
  }
}

export default DuplicateViewPlugin;
