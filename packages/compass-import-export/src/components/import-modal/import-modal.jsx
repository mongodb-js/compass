import React, { PureComponent, useMemo, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import fileOpenDialog from '../../utils/file-open-dialog';
import {
  FINISHED_STATUSES,
  COMPLETED_STATUSES,
  STARTED,
  COMPLETED,
  COMPLETED_WITH_ERRORS,
  CANCELED,
  FAILED,
  UNSPECIFIED,
} from '../../constants/process-status';
import ProgressBar from '../progress-bar';
import ErrorBox from '../error-box';
import ImportPreview from '../import-preview';
import ImportOptions from '../import-options';
import FILE_TYPES from '../../constants/file-types';
import formatNumber from '../../utils/format-number.js';
import {
  startImport,
  cancelImport,
  selectImportFileType,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType,
} from '../../modules/import';
import styles from './import-modal.module.less';
import createStyler from '../../utils/styler';
import classnames from 'classnames';

const style = createStyler(styles, 'import-modal');

/**
 * Progress messages.
 */
const MESSAGES = {
  [STARTED]: 'Importing documents...',
  [CANCELED]: 'Import canceled',
  [COMPLETED]: 'Import completed',
  [COMPLETED_WITH_ERRORS]: 'Import completed with following errors:',
  [FAILED]: 'Failed to import with the following error:',
  [UNSPECIFIED]: '',
};

const SHOW_MORE_STEP = 10;

const DEFAULT_VISIBLE_ERRORS_COUNT = 3;

function ErrorsList({ errors }) {
  const [visibleErrorsCount, setVisibleErrorsCount] = useState(
    DEFAULT_VISIBLE_ERRORS_COUNT
  );

  const normalizedErrorMessages = useMemo(() => {
    // BulkWrite and WriteErrors can have identical messages, we want to leave
    // only unique errors for display. We also reversing to show recent errors
    // higher in the list
    return [...new Set(errors.map((err) => err.message))].reverse();
  }, [errors]);

  const showMoreCount = useMemo(() => {
    return formatNumber(
      Math.min(
        SHOW_MORE_STEP,
        normalizedErrorMessages.length - visibleErrorsCount
      )
    );
  }, [normalizedErrorMessages.length, visibleErrorsCount]);

  const increaseVisibleErrorsCount = useCallback(() => {
    setVisibleErrorsCount((currCount) => currCount + SHOW_MORE_STEP);
  });

  if (normalizedErrorMessages.length === 0) {
    return (
      <div className={style('errors')}>
        <ErrorBox
          dataTestId="import-error-box"
          message={normalizedErrorMessages[0]}
        />
      </div>
    );
  }

  return (
    <div className={style('errors')}>
      <ul className={style('errors-list')}>
        {normalizedErrorMessages.slice(0, visibleErrorsCount).map((message) => (
          <li key={message} className={style('errors-list-item')}>
            <ErrorBox dataTestId="import-error-box" message={message} />
          </li>
        ))}
      </ul>
      {showMoreCount > 0 && (
        <button
          className={classnames(
            'btn btn-default btn-xs',
            style('show-more-errors-button')
          )}
          onClick={increaseVisibleErrorsCount}
        >
          <i className="fa fa-arrow-down" aria-hidden="true" />
          <span className={style('show-more-errors-button-text')}>
            Show {showMoreCount} more errors
          </span>
        </button>
      )}
    </div>
  );
}

ErrorsList.propTypes = {
  errors: PropTypes.array,
};

class ImportModal extends PureComponent {
  static propTypes = {
    open: PropTypes.bool,
    ns: PropTypes.string.isRequired,
    startImport: PropTypes.func.isRequired,
    cancelImport: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,

    /**
     * Shared
     */
    errors: PropTypes.array,
    status: PropTypes.string.isRequired,

    /**
     * See `<ImportOptions />`
     */
    selectImportFileType: PropTypes.func.isRequired,
    selectImportFileName: PropTypes.func.isRequired,
    setDelimiter: PropTypes.func.isRequired,
    delimiter: PropTypes.string,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    stopOnErrors: PropTypes.bool,
    setStopOnErrors: PropTypes.func,
    ignoreBlanks: PropTypes.bool,
    setIgnoreBlanks: PropTypes.func,

    /**
     * See `<ProgressBar />`
     */
    docsTotal: PropTypes.number,
    docsProcessed: PropTypes.number,
    docsWritten: PropTypes.number,
    guesstimatedDocsTotal: PropTypes.number,
    guesstimatedDocsProcessed: PropTypes.number,

    /**
     * See `<ImportPreview />`
     */
    fields: PropTypes.array,
    values: PropTypes.array,
    toggleIncludeField: PropTypes.func.isRequired,
    setFieldType: PropTypes.func.isRequired,
    previewLoaded: PropTypes.bool,
  };

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.cancelImport();
  };

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeImport();
  };

  /**
   * Handle clicking the import button.
   */
  handleImportBtnClicked = () => {
    this.props.startImport();
  };

  // TODO: lucas: Make COMPLETED, FINISHED_STATUSES
  // have better names.
  // COMPLETED = Done and Successful
  // FINISHED_STATUSES = Done and maybe success|error|canceled
  // @irina: "maybe call it IMPORT_STATUS ? since technically a cancelled status means it's not finished"

  /**
   * Has the import completed successfully?
   * @returns {Boolean}
   */
  wasImportSuccessful() {
    return COMPLETED_STATUSES.includes(this.props.status);
  }

  renderDoneButton() {
    if (!this.wasImportSuccessful()) {
      return null;
    }
    return (
      <TextButton
        dataTestId="done-button"
        className="btn btn-primary btn-sm"
        text="DONE"
        clickHandler={this.handleClose}
      />
    );
  }

  renderCancelButton() {
    if (!this.wasImportSuccessful()) {
      return (
        <TextButton
          dataTestId="cancel-button"
          className="btn btn-default btn-sm"
          text={
            FINISHED_STATUSES.includes(this.props.status) ? 'Close' : 'Cancel'
          }
          clickHandler={this.handleClose}
        />
      );
    }
  }

  renderImportButton() {
    if (this.wasImportSuccessful()) {
      return null;
    }
    return (
      <TextButton
        dataTestId="import-button"
        className="btn btn-primary btn-sm"
        text={this.props.status === STARTED ? 'Importing...' : 'Import'}
        disabled={!this.props.fileName || this.props.status === STARTED}
        clickHandler={this.handleImportBtnClicked}
      />
    );
  }

  /**
   * Renders the import preview.
   *
   * @returns {React.Component} The component.
   */
  renderImportPreview() {
    const isCSV = this.props.fileType === FILE_TYPES.CSV;

    if (isCSV) {
      return (
        <ImportPreview
          loaded={this.props.previewLoaded}
          onFieldCheckedChanged={this.props.toggleIncludeField}
          setFieldType={this.props.setFieldType}
          values={this.props.values}
          fields={this.props.fields}
        />
      );
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const {
      status,
      errors,
      docsTotal,
      docsProcessed,
      docsWritten,
      guesstimatedDocsTotal,
      guesstimatedDocsProcessed,
    } = this.props;

    // docsTotal is set to actual value only at the very end of processing a
    // stream of documents
    const isGuesstimated = docsTotal === -1;

    return (
      <Modal
        // Because this modal is rendered outside of the
        // react root we need to apply the deprecated bootstrap styles here.
        className="with-global-bootstrap-styles"
        show={this.props.open}
        onHide={this.handleClose}
        backdrop="static"
        data-testid="import-modal"
      >
        <Modal.Header closeButton>
          Import To Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <ImportOptions
            delimiter={this.props.delimiter}
            setDelimiter={this.props.setDelimiter}
            fileType={this.props.fileType}
            selectImportFileType={this.props.selectImportFileType}
            fileName={this.props.fileName}
            selectImportFileName={this.props.selectImportFileName}
            stopOnErrors={this.props.stopOnErrors}
            setStopOnErrors={this.props.setStopOnErrors}
            ignoreBlanks={this.props.ignoreBlanks}
            setIgnoreBlanks={this.props.setIgnoreBlanks}
            fileOpenDialog={fileOpenDialog}
          />
          {this.renderImportPreview()}
          <ProgressBar
            status={this.props.status}
            withErrors={errors.length > 0}
            cancel={this.props.cancelImport}
            docsWritten={docsWritten}
            docsProcessed={Math.max(docsProcessed, guesstimatedDocsProcessed)}
            docsTotal={
              // When guesstimating, guessed total might be too low, in that
              // case the most reasonable thing to do would be to fallback to
              // currently processed number
              isGuesstimated
                ? Math.max(docsProcessed, guesstimatedDocsTotal)
                : docsTotal
            }
            progressLabel={(written, total) => {
              return `${formatNumber(written)}\u00a0/\u00a0${
                isGuesstimated ? '~' : ''
              }${formatNumber(total)}`;
            }}
            progressTitle={(written, total) => {
              return `Imported ${formatNumber(written)} out of ${
                isGuesstimated ? 'approximately ' : ''
              }${formatNumber(total)} documents`;
            }}
            message={MESSAGES[status]}
          />
          <ErrorsList errors={errors} />
        </Modal.Body>
        <Modal.Footer>
          {this.renderCancelButton()}
          {this.renderImportButton()}
          {this.renderDoneButton()}
        </Modal.Footer>
      </Modal>
    );
  }
}

// TODO: lucas: move connect() and mapStateToProps() to ../../import-plugin.js.
/**
 * Map the state of the store to component properties.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns,
  open: state.importData.isOpen,
  errors: state.importData.errors,
  fileType: state.importData.fileType,
  fileName: state.importData.fileName,
  status: state.importData.status,
  docsTotal: state.importData.docsTotal,
  docsProcessed: state.importData.docsProcessed,
  docsWritten: state.importData.docsWritten,
  guesstimatedDocsTotal: state.importData.guesstimatedDocsTotal,
  guesstimatedDocsProcessed: state.importData.guesstimatedDocsProcessed,
  delimiter: state.importData.delimiter,
  stopOnErrors: state.importData.stopOnErrors,
  ignoreBlanks: state.importData.ignoreBlanks,
  fields: state.importData.fields,
  values: state.importData.values,
  previewLoaded: state.importData.previewLoaded,
});

/**
 * Export the connected component as the default.
 */
export default connect(mapStateToProps, {
  startImport,
  cancelImport,
  selectImportFileType,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType,
})(ImportModal);
