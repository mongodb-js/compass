import React, { Component } from 'react';
import ImportModal from 'components/import-modal';
import { Provider } from 'react-redux';
import store from 'stores';

class ImportPlugin extends Component {
  static displayName = 'ImportPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <ImportModal />
      </Provider>
    );
  }
}

export default ImportPlugin;
