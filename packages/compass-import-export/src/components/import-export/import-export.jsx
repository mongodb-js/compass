import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { TextButton } from 'hadron-react-buttons';
import { nsChanged } from 'modules/ns';
import {
  importAction,
  selectImportFileType,
  selectImportFileName,
  closeImport
} from 'modules/import';
import ExportModal from 'components/export-modal';
import ImportModal from 'components/import-modal';
import {
  exportAction,
  selectExportFileType,
  selectExportFileName,
  closeExport
} from 'modules/export';

import styles from './import-export.less';

class ImportExport extends Component {
  static displayName = 'ImportExportComponent';

  static propTypes = {
    ns: PropTypes.string.isRequired,
    importAction: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,
    importProgress: PropTypes.number,
    importFileType: PropTypes.string.isRequired,
    importFileName: PropTypes.string.isRequired,
    importCount: PropTypes.number,
    importOpen: PropTypes.bool.isRequired,
    importError: PropTypes.object,
    importStatus: PropTypes.string.isRequired,
    selectImportFileType: PropTypes.func.isRequired,
    selectImportFileName: PropTypes.func.isRequired,
    exportAction: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    exportFileType: PropTypes.string.isRequired,
    exportFileName: PropTypes.string.isRequired,
    exportProgress: PropTypes.number,
    exportCount: PropTypes.number,
    exportOpen: PropTypes.bool.isRequired,
    exportError: PropTypes.object,
    exportQuery: PropTypes.object.isRequired,
    exportStatus: PropTypes.string.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired
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
        <ImportModal
          open={this.props.importOpen}
          closeImport={this.props.closeImport}
          importAction={this.props.importAction}
          status={this.props.importStatus}
          progress={this.props.importProgress}
          ns={this.props.ns}
          error={this.props.importError}
          count={this.props.importCount}
          fileType={this.props.importFileType}
          fileName={this.props.importFileName}
          selectImportFileType={this.props.selectImportFileType}
          selectImportFileName={this.props.selectImportFileName} />
        <ExportModal
          open={this.props.exportOpen}
          closeExport={this.props.closeExport}
          exportAction={this.props.exportAction}
          status={this.props.exportStatus}
          progress={this.props.exportProgress}
          ns={this.props.ns}
          query={this.props.exportQuery}
          error={this.props.exportError}
          count={this.props.exportCount}
          fileType={this.props.exportFileType}
          fileName={this.props.exportFileName}
          selectExportFileType={this.props.selectExportFileType}
          selectExportFileName={this.props.selectExportFileName} />
      </div>
    );
  }
}

/**
 * Map the state of the store to component properties.
 *exportAction
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns,
  importProgress: state.importData.progress,
  importCount: state.stats.rawDocumentCount,
  importOpen: state.importData.isOpen,
  importError: state.importData.error,
  importFileType: state.importData.fileType,
  importFileName: state.importData.fileName,
  importStatus: state.importData.status,
  exportProgress: state.exportData.progress,
  exportCount: state.stats.rawDocumentCount,
  exportQuery: state.exportData.query,
  exportOpen: state.exportData.isOpen,
  exportError: state.exportData.error,
  exportFileType: state.exportData.fileType,
  exportFileName: state.exportData.fileName,
  exportStatus: state.exportData.status
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    nsChanged,
    importAction,
    selectImportFileType,
    selectImportFileName,
    closeImport,
    exportAction,
    selectExportFileType,
    selectExportFileName,
    closeExport
  }
)(ImportExport);
