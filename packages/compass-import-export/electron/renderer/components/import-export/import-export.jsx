import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Plugin from 'plugin';
import { TextButton } from 'hadron-react-buttons';

import styles from './import-export.less';

class ImportExport extends Component {
  static displayName = 'ImportExportComponent';

  static propTypes = {
    appRegistry: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  };

  handleExportModalOpen = () => {
    this.props.appRegistry.emit('open-export');
  };

  handleImportModalOpen = () => {
    this.props.appRegistry.emit('open-import');
  };

  /**
   * Render ImportExport component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['import-export'])}>
        <TextButton
          className="btn btn-default btn-sm"
          clickHandler={this.handleImportModalOpen}
          text="Import" />
        <TextButton
          className="btn btn-default btn-sm"
          clickHandler={this.handleExportModalOpen}
          text="Export" />
        <Plugin store={this.props.store} />
      </div>
    );
  }
}

export default ImportExport;
