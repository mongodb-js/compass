import { TextButton } from 'hadron-react-buttons';
import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

class SaveStateModal extends Component {
  static displayName = 'SaveStateModalComponent';

  static propTypes = {
    saveStateModalClose: PropTypes.func.isRequired,
    saveStateModalOpen: PropTypes.func.isRequired,
    savedPipelines: PropTypes.func.isRequired,
    saveErrorClose: PropTypes.func.isRequired,
    saveErrorOpen: PropTypes.func.isRequired,
    saveState: PropTypes.func.isRequired
  }

  // store the input value for pipeline name inside the component before
  // passing it over to save state reducer
  state = {
    inputValue: ''
  }

  savePipelineChangeEvent = (evt) => {
    this.setState({
      inputValue: evt.target.value
    });
  }

  // save state, and pass in the input name
  handleSave = () => {
    this.props.saveState(this.state.inputValue);
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <Modal
        show={this.props.savedPipelines.isModalVisible}
        backdrop="static"
        onHide={this.props.saveStateModalClose}
        dialogClassName="save-state-dialog">

        <Modal.Header>
          <Modal.Title>Save Current Pipeline</Modal.Title>
        </Modal.Header>

        <Modal.Body>
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

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.saveStateModalClose} />
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

export default SaveStateModal;
