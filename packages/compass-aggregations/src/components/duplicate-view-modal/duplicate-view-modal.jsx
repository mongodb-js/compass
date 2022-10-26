import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ModalInput, ModalStatusMessage } from 'hadron-react-components';
import { FormModal } from '@mongodb-js/compass-components';

import { createView } from '../../modules/create-view';
import { changeViewName } from '../../modules/create-view/name';
import { toggleIsVisible } from '../../modules/create-view/is-visible';

const TITLE = 'Duplicate a View';

class DuplicateViewModal extends PureComponent {
  static displayName = 'DuplicateViewModalComponent';

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
      <FormModal
        title={TITLE}
        open={this.props.isVisible}
        onSubmit={this.props.createView}
        onCancel={this.onCancel}
        submitButtonText="Duplicate"
        trackingId="duplicate_view_modal"
        data-testid="duplicate-view-modal"
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
              message="Duplicate in Progress"
              type="in-progress"
            />
          ) : null}
      </FormModal>
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
const MappedDuplicateViewModal = connect(
  mapStateToProps,
  {
    createView,
    changeViewName,
    toggleIsVisible
  }
)(DuplicateViewModal);

export default MappedDuplicateViewModal;
export { DuplicateViewModal };
