import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import styles from './confirm-new-pipeline.module.less';

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
      <ConfirmationModal
        title={QUESTION}
        open={this.props.isNewPipelineConfirm}
        onConfirm={this.onConfirm}
        onCancel={this.onClose}
        buttonText="Confirm"
        trackingId="confirm_new_pipeline_modal"
        data-testid="confirm-new-pipeline-modal"
      >
        <div className={styles['confirm-new-pipeline-note']}>
          {NOTE}
        </div>
      </ConfirmationModal>
    );
  }
}

export default ConfirmNewPipeline;
