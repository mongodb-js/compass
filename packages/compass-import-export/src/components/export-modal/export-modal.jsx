import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Switch from 'react-ios-switch';
import classnames from 'classnames';
import {
  Modal, Button, FormGroup, InputGroup, FormControl, ControlLabel
} from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import QueryViewer from 'components/query-viewer';
import ProgressBar from 'components/progress-bar';
import fileSaveDialog from 'utils/file-save-dialog';
import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import {
  exportAction,
  toggleFullCollection,
  selectExportFileType,
  selectExportFileName,
  closeExport
} from 'modules/export';

import styles from './export-modal.less';

/**
 * Progress messages.
 */
const MESSAGES = {
  [ PROCESS_STATUS.STARTED ]: 'Exporting...',
  [ PROCESS_STATUS.CANCELED ]: 'Export canceled.',
  [ PROCESS_STATUS.COMPLETED ]: 'Export completed!'
};

/**
 * The export collection modal.
 */
class ExportModal extends PureComponent {

  static propTypes = {
    open: PropTypes.bool,
    ns: PropTypes.string.isRequired,
    count: PropTypes.number,
    query: PropTypes.object.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    error: PropTypes.object,
    exportAction: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    isFullCollection: PropTypes.bool.isRequired,
    toggleFullCollection: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string
  };

  /**
   * Get the status message.
   *
   * @returns {String} The status message.
   */
  getStatusMessage = () => {
    return MESSAGES[this.props.status] || (this.props.error ? this.props.error.message : '');
  }

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = () => {
    const file = fileSaveDialog(this.props.fileType);
    if (file) {
      this.props.selectExportFileName(file);
    }
  }

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    if (this.props.status !== PROCESS_STATUS.COMPLETED) {
      this.props.exportAction(PROCESS_STATUS.CANCELLED);
    }
  }

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeExport();
  }

  /**
   * Handle clicking the export button.
   */
  handleExport = () => {
    if (this.props.fileName) {
      this.props.exportAction(PROCESS_STATUS.STARTED);
    }
  }

  /**
   * Render the progress bar.
   *
   * @returns {React.Component} The component.
   */
  renderProgressBar = () => {
    if (this.props.status !== PROCESS_STATUS.UNSPECIFIED) {
      return (
        <ProgressBar
          progress={this.props.progress}
          status={this.props.status}
          message={this.getStatusMessage()}
          action={this.props.exportAction} />
      );
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const queryClassName = classnames({
      [ styles['export-modal-query'] ]: true,
      [ styles['export-modal-query-is-disabled'] ]: this.props.isFullCollection
    });
    return (
      <Modal show={this.props.open} onHide={this.handleClose}>
        <Modal.Header closeButton>
          Export Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <div className={queryClassName}>
            Exporting {this.props.count} documents returned by the following query:
          </div>
          <div>
            <QueryViewer query={this.props.query} disabled={this.props.isFullCollection} />
          </div>
          <div className={classnames(styles['export-modal-toggle-full'])}>
            <Switch
              checked={this.props.isFullCollection}
              onChange={this.props.toggleFullCollection}
              className={classnames(styles['export-modal-toggle-button'])} />
            <div className={classnames(styles['export-modal-toggle-text'])}>
              Export Full Collection
            </div>
          </div>
          <div className={classnames(styles['export-modal-output'])}>
            Select Output File Type
          </div>
          <div
            className={classnames(styles['export-modal-type-selector'])}
            type="radio"
            name="file-type-selector">
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.JSON})}
              onClick={this.props.selectExportFileType.bind(this, FILE_TYPES.JSON)}>JSON</Button>
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.CSV})}
              onClick={this.props.selectExportFileType.bind(this, FILE_TYPES.CSV)}>CSV</Button>
          </div>
          <form>
            <FormGroup controlId="export-file">
              <ControlLabel>Select File</ControlLabel>
              <InputGroup>
                <FormControl type="text" value={this.props.fileName} readOnly />
                <InputGroup.Button>
                  <Button onClick={this.handleChooseFile}>Browse</Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </form>
          {this.renderProgressBar()}
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text={this.props.status === PROCESS_STATUS.COMPLETED ? 'Close' : 'Cancel'}
            clickHandler={this.handleClose} />
          <TextButton
            className="btn btn-primary btn-sm"
            text="Export"
            disabled={this.props.status === PROCESS_STATUS.STARTED}
            clickHandler={this.handleExport} />
        </Modal.Footer>
      </Modal>
    );
  }
}

/**
 * Map the state of the store to component properties.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns,
  progress: state.exportData.progress,
  count: state.stats.rawDocumentCount,
  query: state.exportData.query,
  isFullCollection: state.exportData.isFullCollection,
  open: state.exportData.isOpen,
  error: state.exportData.error,
  fileType: state.exportData.fileType,
  fileName: state.exportData.fileName,
  status: state.exportData.status
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    exportAction,
    toggleFullCollection,
    selectExportFileType,
    selectExportFileName,
    closeExport
  }
)(ExportModal);
