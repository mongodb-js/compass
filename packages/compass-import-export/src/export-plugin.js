import React, { Component } from 'react';
import { Provider } from 'react-redux';
import ExportModal from './components/export-modal';
import exportStore from './stores/export-store';

class ExportPlugin extends Component {
  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={exportStore}>
        <ExportModal />
      </Provider>
    );
  }
}

export default ExportPlugin;
