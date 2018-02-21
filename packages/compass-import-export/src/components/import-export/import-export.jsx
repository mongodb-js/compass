import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextButton } from 'hadron-react-buttons';

import styles from './import-export.less';

class ImportExport extends Component {
  static displayName = 'ImportExportComponent';

  static propTypes = {
    ns: PropTypes.string.isRequired
  };

  handleExportModalOpen = () => {
    global.hadronApp.appRegistry.emit('open-export', this.props.ns, { filter: {}});
  };

  handleImportModalOpen = () => {
    global.hadronApp.appRegistry.emit('open-import', this.props.ns);
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
      </div>
    );
  }
}

export default ImportExport;
