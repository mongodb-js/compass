import { TextButton } from 'hadron-react-buttons';
import React, { PureComponent } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { ModalInput, ModalStatusMessage } from 'hadron-react-components';

import { createView } from 'modules/create-view';
import { changeViewName } from 'modules/create-view/name';
import { toggleIsVisible } from 'modules/create-view/is-visible';

import styles from './create-view-modal.less';

class CreateViewModal extends PureComponent {
  static displayName = 'CreateViewModalComponent';

  static propTypes = {
    createView: PropTypes.func.isRequired,

    isVisible: PropTypes.bool.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,

    name: PropTypes.string,
    changeViewName: PropTypes.func.isRequired,

    source: PropTypes.string.isRequired,
    pipeline: PropTypes.array.isRequired,
    isRunning: PropTypes.bool.isRequired,
    error: PropTypes.object
  };

  static defaultProps = {
    name: '',
    source: '',
    pipeline: [],
    isRunning: false,
    isVisible: false
  };

  onNameChange = (evt) => {
    this.props.changeViewName(evt.target.value);
  };

  onFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    console.log('onFormSubmit', createView);
    this.props.createView();
  };

  onCancel = () => {
    this.props.toggleIsVisible(false);
  };

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <Modal
        show={this.props.isVisible}
        backdrop="static"
        bsSize="small"
        onHide={this.onCancel}
        dialogClassName={styles['create-view-modal']}>
        <Modal.Header>
          <Modal.Title>Create a View</Modal.Title>
        </Modal.Header>

        <Modal.Body className={styles['create-view-modal-body']}>
          <form
            name="create-view-modal-form"
            onSubmit={this.onFormSubmit.bind(this)}
            data-test-id="create-view-modal">
            <ModalInput
              autoFocus
              id="create-view-name"
              value={this.props.name}
              onChangeHandler={this.onNameChange}
            />
            {this.props.error ? (
              <ModalStatusMessage
                icon="times"
                message={this.props.error.message}
                type="error"
              />
            ) : null}
            {this.props.isRunning ? (
              <ModalStatusMessage
                icon="spinner"
                message="Create in Progress"
                type="in-progress"
              />
            ) : null}
          </form>
        </Modal.Body>

        <Modal.Footer className={styles['create-view-modal-footer']}>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="cancel-create-view-button"
            text="Cancel"
            clickHandler={this.onCancel}
          />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-view-button"
            text="Create"
            clickHandler={this.props.createView}
          />
        </Modal.Footer>
      </Modal>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  error: state.error,
  source: state.source,
  pipeline: state.pipeline
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateViewModal = connect(
  mapStateToProps,
  {
    createView,
    changeViewName,
    toggleIsVisible
  }
)(CreateViewModal);

export default MappedCreateViewModal;
export { CreateViewModal };
