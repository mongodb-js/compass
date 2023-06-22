import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FormModal, TextInput } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-DATABASES-COLLECTIONS-UI');

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
    clonePipeline: PropTypes.func.isRequired,
  };

  componentDidUpdate(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      track('Screen', { name: 'save_pipeline_modal' });
    }
  }

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
        data-testid="save-pipeline-modal"
      >
        <TextInput
          id="save-pipeline-name"
          value={this.props.name}
          onChange={this.onNameChanged.bind(this)}
          label="Name"
          name="name"
        />
      </FormModal>
    );
  }
}

export default SavingPipelineModal;
