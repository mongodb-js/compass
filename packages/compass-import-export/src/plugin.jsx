import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImportPlugin from './import-plugin';
import ExportPlugin from './export-plugin';

class Plugin extends Component {
  static displayName = 'ImportExportPlugin';
  static propTypes = {
    exportStore: PropTypes.object.isRequired,
    importStore: PropTypes.object.isRequired,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <ImportPlugin store={this.props.importStore} />
        <ExportPlugin store={this.props.exportStore} />
      </div>
    );
  }
}

export default Plugin;
