import React, { Component } from 'react';
import ImportExport from 'components/import-export';
import store from 'stores';
import { Provider } from 'react-redux';
import ImportPlugin from './import-plugin';
import ExportPlugin from './export-plugin';

class Plugin extends Component {
  static displayName = 'ImportExportPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <div>
          <ImportExport />
          <ImportPlugin />
          <ExportPlugin />
        </div>
      </Provider>
    );
  }
}

export default Plugin;
