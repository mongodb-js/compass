import React, { Component } from 'react';
import ImportExport from 'components/import-export';
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
      <div>
        <ImportExport />
        <ImportPlugin />
        <ExportPlugin />
      </div>
    );
  }
}

export default Plugin;
