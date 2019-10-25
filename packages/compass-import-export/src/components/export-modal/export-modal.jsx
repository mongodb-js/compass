import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Switch from 'react-ios-switch';
import classnames from 'classnames';
import {
  Modal,
  FormGroup,
  InputGroup,
  FormControl,
  ControlLabel
} from 'react-bootstrap';
import { TextButton, IconTextButton } from 'hadron-react-buttons';
import QueryViewer from 'components/query-viewer';
import ProgressBar from 'components/progress-bar';
import ErrorBox from 'components/error-box';
import SelectFileType from 'components/select-file-type';

import fileSaveDialog from 'utils/file-save-dialog';
import revealFile from 'utils/reveal-file';
import formatNumber from 'utils/format-number';

import {
  STARTED,
  CANCELED,
  COMPLETED,
  UNSPECIFIED
} from 'constants/process-status';
import {
  startExport,
  cancelExport,
  toggleFullCollection,
  selectExportFileType,
  selectExportFileName,
  closeExport
} from 'modules/export';

import styles from './export-modal.less';
import createStyler from 'utils/styler.js';
const style = createStyler(styles, 'export-modal');

/**
 * TODO: lucas: When import complete, maybe:
 * 1. hide “cancel” and replace “import” with “done”?
 * 2. "canel" button -> "close" and import becomes "import another"
 * or "view documents"?
 */

/**
 * Progress messages.
 */
const MESSAGES = {
  [STARTED]: 'Exporting documents...',
  [CANCELED]: 'Export canceled',
  [COMPLETED]: 'Export completed',
  [UNSPECIFIED]: ''
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
    startExport: PropTypes.func.isRequired,
    cancelExport: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    isFullCollection: PropTypes.bool.isRequired,
    toggleFullCollection: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    exportedDocsCount: PropTypes.number
  };

  /**
   * Get the status message.
   *
   * @returns {String} The status message.
   */
  getStatusMessage = () => {
    return (
      MESSAGES[this.props.status] ||
      (this.props.error ? this.props.error.message : '')
    );
  };

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = () => {
    const file = fileSaveDialog(this.props.fileType);
    if (file) {
      this.props.selectExportFileName(file);
    }
  };

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.cancelExport();
  };

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeExport();
  };

  /**
   * Handle clicking the export button.
   */
  handleExport = () => {
    this.props.startExport();
  };

  handleRevealClick = () => {
    revealFile(this.props.fileName);
  };

  /**
   * Stop form default submission to a whitescreen
   * and start the export if ready.
   * @param {Object} evt - DOM event
   */
  handleOnSubmit = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.props.fileName) {
      this.props.startExport();
    }
  };

  renderExportButton() {
    if (this.props.status === COMPLETED) {
      return (
        <TextButton
          className="btn btn-primary btn-sm"
          text="Show File"
          clickHandler={this.handleRevealClick}
        />
      );
    }
    return (
      <TextButton
        className="btn btn-primary btn-sm"
        text="Export"
        disabled={this.props.status === STARTED}
        clickHandler={this.handleExport}
      />
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const { isFullCollection } = this.props;

    const queryClassName = classnames({
      [style('query')]: true,
      [style('query-is-disabled')]: isFullCollection
    });
    const queryViewerClassName = classnames({
      [style('query-viewer-is-disabled')]: isFullCollection
    });

    return (
      <Modal show={this.props.open} onHide={this.handleClose} backdrop="static">
        <Modal.Header closeButton>
          Export Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <div>
            <div className={queryClassName}>
              There are {formatNumber(this.props.count)} documents in the
              collection. Exporting with the query:
            </div>
            <div className={queryViewerClassName}>
              <QueryViewer
                query={this.props.query}
                disabled={isFullCollection}
                ns={this.props.ns}
              />
            </div>
            <div className={style('toggle-full')}>
              <Switch
                checked={isFullCollection}
                onChange={this.props.toggleFullCollection}
                className={style('toggle-button')}
              />
              <div className={style('toggle-text')}>Export Full Collection</div>
            </div>
          </div>
          <form onSubmit={this.handleOnSubmit} className={style('form')}>
            <SelectFileType
              fileType={this.props.fileType}
              onSelected={this.props.selectExportFileType}
              label="Select Output File Type"
            />
            <FormGroup controlId="export-file">
              <ControlLabel>Select File</ControlLabel>
              <InputGroup bsClass={style('browse-group')}>
                <FormControl type="text" value={this.props.fileName} readOnly />
                <IconTextButton
                  text="Browse"
                  clickHandler={this.handleChooseFile}
                  className={style('browse-button')}
                  iconClassName="fa fa-folder-open-o"
                />
              </InputGroup>
            </FormGroup>
          </form>
          <ProgressBar
            progress={this.props.progress}
            status={this.props.status}
            message={MESSAGES[this.props.status]}
            cancel={this.props.cancelExport}
            docsWritten={this.props.exportedDocsCount}
            docsTotal={this.props.count}
          />
          <ErrorBox error={this.props.error} />
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text={this.props.status === COMPLETED ? 'Close' : 'Cancel'}
            clickHandler={this.handleClose}
          />
          {this.renderExportButton()}
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
const mapStateToProps = state => ({
  ns: state.ns,
  progress: state.exportData.progress,
  count: state.exportData.count || state.stats.rawDocumentCount,
  query: state.exportData.query,
  isFullCollection: state.exportData.isFullCollection,
  open: state.exportData.isOpen,
  error: state.exportData.error,
  fileType: state.exportData.fileType,
  fileName: state.exportData.fileName,
  status: state.exportData.status,
  exportedDocsCount: state.exportData.exportedDocsCount
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    startExport,
    cancelExport,
    toggleFullCollection,
    selectExportFileType,
    selectExportFileName,
    closeExport
  }
)(ExportModal);
