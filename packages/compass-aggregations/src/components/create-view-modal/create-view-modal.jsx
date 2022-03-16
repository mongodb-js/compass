import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ConfirmationModal } from '@mongodb-js/compass-components';
import { ModalInput, ModalStatusMessage } from 'hadron-react-components';

import { createView } from '../../modules/create-view';
import { changeViewName } from '../../modules/create-view/name';
import { toggleIsVisible } from '../../modules/create-view/is-visible';

class CreateViewModal extends PureComponent {
  static displayName = 'CreateViewModalComponent';

  static propTypes = {
    createView: PropTypes.func.isRequired,

    isVisible: PropTypes.bool.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,

    name: PropTypes.string,
    changeViewName: PropTypes.func.isRequired,
    isDuplicating: PropTypes.bool.isRequired,

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
    isVisible: false,
    isDuplicating: false
  };

  onNameChange = (evt) => {
    this.props.changeViewName(evt.target.value);
  };

  onFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
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
      <ConfirmationModal
        title={this.props.isDuplicating ? 'Duplicate View' : 'Create a View'}
        open={this.props.isVisible}
        onConfirm={this.props.createView}
        onCancel={this.onCancel}
        buttonText="Create"
        trackingId="create_view_modal"
      >
        <form
          name="create-view-modal-form"
          onSubmit={this.onFormSubmit.bind(this)}
          data-test-id="create-view-modal"
        >
          <ModalInput
            id="create-view-name"
            name="Enter a View Name"
            value={this.props.name || ''}
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
      </ConfirmationModal>
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
  isDuplicating: state.isDuplicating,
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
