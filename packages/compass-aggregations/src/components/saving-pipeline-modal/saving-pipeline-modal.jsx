import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';

import styles from './saving-pipeline-modal.less';

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
      <Modal
        className={styles['saving-pipeline-modal']}
        show={this.props.isOpen}
        onHide={this.props.savingPipelineCancel}>
        <Modal.Header closeButton>
          <h4>{title}</h4>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.onSubmit.bind(this)}>
            <input
              type="text"
              value={this.props.name}
              onChange={this.onNameChanged.bind(this)}
              className="form-control input-lg"
              placeholder="Untitled"
            />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            id="cancel-saving-pipeline"
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.savingPipelineCancel}
          />
          <TextButton
            id="apply-saving-pipeline"
            className="btn btn-primary btn-sm"
            text="Save"
            disabled={this.props.name === ''}
            clickHandler={this.save.bind(this)}
          />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default SavingPipelineModal;
