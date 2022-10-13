import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FormModal, css, cx, spacing } from '@mongodb-js/compass-components';

/**
 * Saving pipeline modal.
 */
class SavingPipelineModal extends PureComponent {
  static displayName = 'SavingPipelineModalComponent';

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    isSaveAs: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    savingPipelineCancel: PropTypes.func.isRequired,
    savingPipelineApply: PropTypes.func.isRequired,
    savingPipelineNameChanged: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired
  };

  /**
   * Handle the value of the input being changed.
   *
   * @param {Event} evt
   * @returns {void}
   */
  onNameChanged(evt) {
    this.props.savingPipelineNameChanged(evt.currentTarget.value);
  }

  /**
   * Calls back to action handlers for changing the name and saving it.
   *
   * If canceling from `Save As...`, the current pipeline is not cloned.
   * @returns {void}
   */
  save() {
    if (this.props.isSaveAs) {
      this.props.clonePipeline();
    }

    this.props.savingPipelineApply();
    this.props.saveCurrentPipeline();
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const title = this.props.isSaveAs ? 'Save Pipeline As...' : 'Save Pipeline';
    return (
      <FormModal
        title={title}
        open={this.props.isOpen}
        onSubmit={this.save.bind(this)}
        onCancel={this.props.savingPipelineCancel}
        submitButtonText="Save"
        submitDisabled={this.props.name === ''}
        trackingId="save_pipeline_modal"
      >
        <input
          id="save-pipeline-name"
          type="text"
          value={this.props.name}
          onChange={this.onNameChanged.bind(this)}
          className={cx('form-control', css({ marginTop: spacing[1] }))}
          placeholder="Untitled"
        />
      </FormModal>
    );
  }
}

export default SavingPipelineModal;
