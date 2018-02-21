import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  Modal, Button, FormGroup, InputGroup, FormControl, ControlLabel, ProgressBar
} from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import fileOpenDialog from 'utils/file-open-dialog';
import PROCESS_STATUS, { FINISHED_STATUSES } from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import CancelButton from 'components/cancel-button';

import styles from './import-modal.less';

/**
 * The error message.
 */
const ERROR = 'Import ran with errors:';

/**
 * The import collection modal.
 */
class ImportModal extends PureComponent {

  static propTypes = {
    open: PropTypes.bool,
    ns: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    error: PropTypes.object,
    importAction: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,
    selectImportFileType: PropTypes.func.isRequired,
    selectImportFileName: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string
  };

  /**
   * Get the bootstrap progress bar style.
   *
   * @returns {String} The style.
   */
  getProgressStyle() {
    if (this.props.status === PROCESS_STATUS.STARTED) return 'info';
    if (this.props.status === PROCESS_STATUS.COMPLETED) return 'success';
    if (this.props.status === PROCESS_STATUS.CANCELED) return 'warning';
    if (this.props.status === PROCESS_STATUS.FAILED) return 'warning';
  }

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = () => {
    const file = fileOpenDialog(this.props.fileType);
    if (file) {
      this.props.selectImportFileName(file[0]);
    }
  }

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    if (this.props.status !== PROCESS_STATUS.COMPLETED) {
      this.props.importAction(PROCESS_STATUS.CANCELLED);
    }
  }

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeImport();
  }

  /**
   * Handle clicking the import button.
   */
  handleImport = () => {
    if (this.props.fileName) {
      this.props.importAction(PROCESS_STATUS.STARTED);
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const errorClassName = classnames({
      [ styles['import-modal-error'] ]: true,
      [ styles['import-modal-error-has-error'] ]: this.props.error ? true : false
    });
    return (
      <Modal show={this.props.open} onHide={this.handleClose} >
        <Modal.Header closeButton>
          Import To Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <div className={classnames(styles['import-modal-input'])}>
            Select Input File Type
          </div>
          <div
            className={classnames(styles['import-modal-type-selector'])}
            type="radio"
            name="file-type-selector">
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.JSON})}
              onClick={this.props.selectImportFileType.bind(this, FILE_TYPES.JSON)}>JSON</Button>
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.CSV})}
              onClick={this.props.selectImportFileType.bind(this, FILE_TYPES.CSV)}>CSV</Button>
          </div>
          <form>
            <FormGroup controlId="import-file">
              <ControlLabel>Select File</ControlLabel>
              <InputGroup>
                <FormControl type="text" value={this.props.fileName} readOnly />
                <InputGroup.Button>
                  <Button onClick={this.handleChooseFile}>Browse</Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </form>
          <div className={classnames(styles['import-modal-progress'])}>
            <div className={classnames(styles['import-modal-progress-bar'])}>
              <ProgressBar
                now={this.props.progress}
                bsStyle={this.getProgressStyle()} />
            </div>
            <div className={classnames(styles['import-modal-progress-cancel'])}>
              <CancelButton onClick={this.handleCancel} />
            </div>
          </div>
          <div className={errorClassName}>
            {this.props.error ? `${ERROR} ${this.props.error.message}` : null}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text={FINISHED_STATUSES.includes(this.props.status) ? 'Close' : 'Cancel'}
            clickHandler={this.handleClose} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="insert-document-button"
            text="Import"
            clickHandler={this.handleImport} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ImportModal;
