import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ConfirmationModal } from '@mongodb-js/compass-components';

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
   * Handle the form submission for `Hit Enter` to save.
   *
   * @param {Event} evt
   * @returns {void}
   */
  onSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.save();
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
      <ConfirmationModal
        title={title}
        open={this.props.isOpen}
        onConfirm={this.save.bind(this)}
        onCancel={this.props.savingPipelineCancel}
        buttonText="Save"
        submitDisabled={this.props.name === ''}
        trackingId="save_pipeline_modal"
      >
        <form onSubmit={this.onSubmit.bind(this)}>
          <input
            id="save-pipeline-name"
            type="text"
            value={this.props.name}
            onChange={this.onNameChanged.bind(this)}
            className="form-control"
            placeholder="Untitled"
          />
        </form>
      </ConfirmationModal>
    );
  }
}

export default SavingPipelineModal;
