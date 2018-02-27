import { TextButton } from 'hadron-react-buttons';
import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './restore-pipeline-modal.less';

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
      <Modal
        show={this.props.restorePipeline.isModalVisible}
        backdrop="static"
        bsSize="small"
        onHide={this.onRestorePipelineModalToggle}
        dialogClassName={classnames(styles['restore-pipeline-modal'])}>

        <Modal.Header className={classnames(styles['restore-pipeline-modal-header'])}>
          <Modal.Title> Are you sure you want to open this pipeline? </Modal.Title>
        </Modal.Header>

        <Modal.Body className={classnames(styles['restore-pipeline-modal-body'])}>
          Opening this project will abandon <b>unsaved</b> changes to the current pipeline you are building.
        </Modal.Body>

        <Modal.Footer className={classnames(styles['restore-pipeline-modal-footer'])}>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.onRestorePipelineModalToggle} />
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="open-pipeline-button"
            text="Open Pipeline"
            clickHandler={this.openPipeline} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default RestorePipelineModal;
