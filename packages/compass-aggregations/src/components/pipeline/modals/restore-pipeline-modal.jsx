import React, { Component } from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import PropTypes from 'prop-types';

const TITLE = 'Are you sure you want to open this pipeline?';

class RestorePipelineModal extends Component {
  static displayName = 'RestorePipelineModalComponent';

  static propTypes = {
    restorePipelineModalToggle: PropTypes.func.isRequired,
    getPipelineFromIndexedDB: PropTypes.func.isRequired,
    restorePipeline: PropTypes.object.isRequired
  }

  // close the modal
  onRestorePipelineModalToggle = () => {
    this.props.restorePipelineModalToggle(0);
  }

  openPipeline = () => {
    this.props.getPipelineFromIndexedDB(this.props.restorePipeline.pipelineObjectID);
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <ConfirmationModal
        title={TITLE}
        open={this.props.restorePipeline.isModalVisible}
        onConfirm={this.openPipeline}
        onCancel={this.onRestorePipelineModalToggle}
        buttonText="Open Pipeline"
      >
        Opening this project will abandon <b>unsaved</b> changes to the current pipeline you are building.
      </ConfirmationModal>
    );
  }
}

export default RestorePipelineModal;
