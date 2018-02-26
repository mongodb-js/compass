import { TextButton } from 'hadron-react-buttons';
import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './save-pipeline-modal.less';

class SavePipelineModal extends Component {
  static displayName = 'SavePipelineModalComponent';

  static propTypes = {
    savePipelineModalToggle: PropTypes.func.isRequired,
    saveModalErrorToggle: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired
  }

  // store the input value for pipeline name inside the component before
  // passing it over to save state reducer
  state = {
    inputValue: ''
  }

  onSavePipelineModalToggle = () => {
    this.props.savePipelineModalToggle(0);
  };

  savePipelineChangeEvent = (evt) => {
    this.setState({
      inputValue: evt.target.value
    });
  }

  // save state, and pass in the input name
  handleSave = () => {
    this.props.saveCurrentPipeline(this.state.inputValue);
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <Modal
        show={this.props.savedPipeline.isModalVisible}
        backdrop="static"
        onHide={this.onSavePipelineModalToggle}
        dialogClassName={classnames(styles['save-pipeline-modal'])}>

        <Modal.Header className={classnames(styles['save-pipeline-modal-header'])}>
          <Modal.Title>Save Current Pipeline</Modal.Title>
        </Modal.Header>

        <Modal.Body className={classnames(styles['save-pipeline-modal-body'])}>
          <form name="save-state-form"
              onSubmit={this.handleSave}
              data-test-id="save-state">
            <div className="form-group">
              <p>Pipeline Name</p>
              <input
                autoFocus
                type="text"
                className="form-control"
                id="save-state-pipeline-name"
                name="Pipeline Name"
                value={this.state.inputValue}
                onChange={this.savePipelineChangeEvent} />
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer className={classnames(styles['save-pipeline-modal-footer'])}>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.onSavePipelineModalToggle} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-database-button"
            text="Save Pipeline"
            clickHandler={this.handleSave} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default SavePipelineModal;
