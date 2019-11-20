import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  Modal,
  FormGroup,
} from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import ExportSelectOutput from 'components/export-select-output';
import ExportSelectFields from 'components/export-select-fields';
import QueryViewer from 'components/query-viewer';
import ErrorBox from 'components/error-box';

import revealFile from 'utils/reveal-file';
import formatNumber from 'utils/format-number';

import {
  STARTED,
  CANCELED,
  COMPLETED,
  UNSPECIFIED
} from 'constants/process-status';

import {
  QUERY,
  FIELDS,
  FILETYPE
} from 'constants/export-step';

import {
  closeExport,
  startExport,
  sampleFields,
  cancelExport,
  updateFields,
  changeExportStep,
  selectExportFileType,
  selectExportFileName,
  toggleFullCollection,
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
    error: PropTypes.object,
    count: PropTypes.number,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    ns: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    status: PropTypes.string.isRequired,
    fields: PropTypes.object.isRequired,
    exportedDocsCount: PropTypes.number,
    progress: PropTypes.number.isRequired,
    startExport: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    cancelExport: PropTypes.func.isRequired,
    exportStep: PropTypes.string.isRequired,
    sampleFields: PropTypes.func.isRequired,
    updateFields: PropTypes.func.isRequired,
    isFullCollection: PropTypes.bool.isRequired,
    changeExportStep: PropTypes.func.isRequired,
    toggleFullCollection: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
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

  /**
   * Start the next step of exporting: selecting fields
   * @param {String} status: next export status
   */
  handleChangeModalStatus = (status) => {
    this.props.changeExportStep(status);

    if (status === FIELDS && Object.entries(this.props.fields).length === 0) {
      this.props.sampleFields();
    }
  }

  handleRevealClick = () => {
    revealFile(this.props.fileName);
  };

  /**
   * Handle switching between filtered and full export.
   */
  handleExportOptionSelect = () => {
    this.props.toggleFullCollection();
  }

  /**
   * Return back in export flow.
   */
  handleBackButton = () => {
    const previousState = this.props.exportStep === FILETYPE ? FIELDS : QUERY;
    this.handleChangeModalStatus(previousState);
  }

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

  renderExportOptions() {
    if (this.props.exportStep !== QUERY) return null;

    const { isFullCollection } = this.props;

    const queryClassName = classnames({
      [style('query')]: true,
      [style('query-is-disabled')]: isFullCollection
    });

    const queryViewerClassName = classnames({
      [style('query-viewer')]: true,
      [style('query-viewer-is-disabled')]: isFullCollection
    });

    return (
      <FormGroup controlId="export-collection-option">
        <div className={style('radio')}>
          <label className={queryClassName}>
            <input type="radio"
              value="filter"
              checked={!isFullCollection}
              onChange={this.handleExportOptionSelect}
              aria-label="Export collection with filters radio button"/>
            Export query with filters &mdash; {formatNumber(this.props.count)} results (Recommended)
          </label>
        </div>
        <div className={queryViewerClassName}>
          <QueryViewer
            ns={this.props.ns}
            query={this.props.query}
            disabled={isFullCollection}/>
        </div>
        <div className={style('radio')}>
          <label>
            <input type="radio"
              value="full"
              checked={isFullCollection}
              onChange={this.handleExportOptionSelect}
              aria-label="Export full collection radio button"/>
            Export Full Collection
          </label>
        </div>
      </FormGroup>
    );
  }

  renderSelectFields() {
    return (
      <ExportSelectFields
        fields={this.props.fields}
        exportStep={this.props.exportStep}
        updateFields={this.props.updateFields}/>
    );
  }

  renderSelectOutput() {
    return (
      <ExportSelectOutput
        count={this.props.count}
        status={this.props.status}
        fileType={this.props.fileType}
        fileName={this.props.fileName}
        progress={this.props.progress}
        exportStep={this.props.exportStep}
        startExport={this.props.startExport}
        cancelExport={this.props.cancelExport}
        exportedDocsCount={this.props.exportedDocsCount}
        selectExportFileType={this.props.selectExportFileType}
        selectExportFileName={this.props.selectExportFileName}/>
    );
  }

  renderBackButton() {
    const backButtonClassname = classnames('btn', 'btn-default', 'btn-sm', style('back-button'));

    if (this.props.exportStep !== QUERY) {
      return (
        <TextButton
          text="< BACK"
          className={backButtonClassname}
          clickHandler={this.handleBackButton}/>
      );
    }
  }

  renderNextButton() {
    // only show "Show File" Button on the last stage of export modal
    if (this.props.status === COMPLETED && this.props.exportStep === FILETYPE) {
      return (
        <TextButton
          text="Show File"
          className="btn btn-primary btn-sm"
          clickHandler={this.handleRevealClick}/>
      );
    }
    if (this.props.exportStep === QUERY) {
      return (
        <TextButton
          text="Select Fields"
          className="btn btn-primary btn-sm"
          clickHandler={this.handleChangeModalStatus.bind(this, FIELDS)}/>
      );
    }
    if (this.props.exportStep === FIELDS) {
      // if all fields are disselected diable "Select Output" button
      const emptyFields = Object.entries(this.props.fields).length === 0;

      return (
        <TextButton
          text="Select Output"
          disabled={emptyFields}
          className="btn btn-primary btn-sm"
          clickHandler={this.handleChangeModalStatus.bind(this, FILETYPE)}/>
      );
    }
    return (
      <TextButton
        text="Export"
        clickHandler={this.handleExport}
        className="btn btn-primary btn-sm"
        disabled={this.props.status === STARTED}/>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    // only show 'Close' button on the last stage on export modal when export
    // was completed.
    const closeButton =
      this.props.status === COMPLETED && this.props.exportStep === FILETYPE
        ? 'Close'
        : 'Cancel';

    return (
      <Modal show={this.props.open} onHide={this.handleClose} backdrop="static">
        <Modal.Header closeButton>
          Export Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          {this.renderExportOptions()}
          {this.renderSelectFields()}
          {this.renderSelectOutput()}
          <ErrorBox error={this.props.error} />
        </Modal.Body>
        <Modal.Footer>
          {this.renderBackButton()}
          <TextButton
            text={closeButton}
            clickHandler={this.handleClose}
            className="btn btn-default btn-sm"/>
          {this.renderNextButton()}
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
  error: state.exportData.error,
  query: state.exportData.query,
  open: state.exportData.isOpen,
  status: state.exportData.status,
  fields: state.exportData.fields,
  fileType: state.exportData.fileType,
  fileName: state.exportData.fileName,
  progress: state.exportData.progress,
  exportStep: state.exportData.exportStep,
  isFullCollection: state.exportData.isFullCollection,
  exportedDocsCount: state.exportData.exportedDocsCount,
  count: state.exportData.count || state.stats.rawDocumentCount,
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    startExport,
    closeExport,
    sampleFields,
    cancelExport,
    updateFields,
    changeExportStep,
    selectExportFileType,
    selectExportFileName,
    toggleFullCollection,
  }
)(ExportModal);
