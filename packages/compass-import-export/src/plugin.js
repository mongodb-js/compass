import React, { Component } from 'react';
import ImportExport from 'components/import-export';
import { Provider } from 'react-redux';
import store from 'stores';

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
        <ImportExport />
      </Provider>
    );
  }
}

export default Plugin;
