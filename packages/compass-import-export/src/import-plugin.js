import React, { Component } from 'react';
import { Provider } from 'react-redux';
import ImportModal from './components/import-modal';
import importStore from './stores/import-store';

class ImportPlugin extends Component {
  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={importStore}>
        <ImportModal />
      </Provider>
    );
  }
}

export default ImportPlugin;
