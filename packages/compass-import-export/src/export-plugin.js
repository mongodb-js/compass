import React, { Component } from 'react';
import ExportModal from 'components/export-modal';
import { Provider } from 'react-redux';
import store from 'stores';

class ExportPlugin extends Component {
  static displayName = 'ExportPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <ExportModal />
      </Provider>
    );
  }
}

export default ExportPlugin;
