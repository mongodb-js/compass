import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';

import styles from './confirm-import-pipeline.less';

/**
 * Question text.
 */
const QUESTION = 'Are you sure you want to create a new pipeline?';

/**
 * The note.
 */
const NOTE = 'Creating this pipeline will abandon unsaved changes to the current pipeline.';

/**
 * Confirm import pipeline modal.
 */
class ConfirmImportPipeline extends PureComponent {
  static displayName = 'ConfirmImportPipelineComponent';

  static propTypes = {
    isConfirmationNeeded: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    closeImport: PropTypes.func.isRequired,
    confirmNew: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired
  }

  onConfirm = () => {
    this.props.confirmNew();
    if (this.props.isAutoPreviewing) {
      this.props.runStage(0);
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.isConfirmationNeeded} onHide={this.props.closeImport}>
        <Modal.Header closeButton>
          <h4>{QUESTION}</h4>
        </Modal.Header>
        <Modal.Body>
          <div className={classnames(styles['confirm-import-pipeline-note'])}>
            {NOTE}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            id="cancel-confirm-import-pipeline"
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.closeImport} />
          <TextButton
            id="confirm-import-pipeline"
            className="btn btn-primary btn-sm"
            text="Confirm"
            clickHandler={this.onConfirm} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ConfirmImportPipeline;
