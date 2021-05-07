import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';

import styles from './confirm-new-pipeline.less';

/**
 * Question text.
 */
const QUESTION = 'Are you sure you want to create a new pipeline?';

/**
 * The note.
 */
const NOTE = 'Creating this pipeline will abandon unsaved changes to the current pipeline.';

/**
 * Confirm new pipeline modal.
 */
class ConfirmNewPipeline extends PureComponent {
  static displayName = 'ConfirmNewPipelineComponent';

  static propTypes = {
    isNewPipelineConfirm: PropTypes.bool.isRequired,
    setIsNewPipelineConfirm: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired
  }

  /**
   * Handles clicks on the `Confirm` button.
   */
  onConfirm = () => {
    this.props.newPipeline();
    this.onClose();
  }

  /**
   * Closes the current modal.
   */
  onClose = () => {
    this.props.setIsNewPipelineConfirm(false);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.isNewPipelineConfirm}>
        <Modal.Header closeButton>
          <h4>{QUESTION}</h4>
        </Modal.Header>
        <Modal.Body>
          <div className={styles['confirm-new-pipeline-note']}>
            {NOTE}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            id="cancel-confirm-new-pipeline"
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.onClose} />
          <TextButton
            id="confirm-new-pipeline"
            className="btn btn-primary btn-sm"
            text="Confirm"
            clickHandler={this.onConfirm} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ConfirmNewPipeline;
