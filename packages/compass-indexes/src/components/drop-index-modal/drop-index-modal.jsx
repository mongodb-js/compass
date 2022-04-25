import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ModalStatusMessage } from 'hadron-react-components';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import styles from './drop-index-modal.module.less';

import { toggleIsVisible } from '../../modules/is-visible';
import { toggleInProgress } from '../../modules/in-progress';
import { changeName } from '../../modules/drop-index/name';
import { changeConfirmName } from '../../modules/drop-index/confirm-name';
import { handleError, clearError } from '../../modules/error';
import { dropIndex } from '../../modules/drop-index';
import { resetForm } from '../../modules/reset-form';

/**
 * Component for the drop confirmation modal.
 */
class DropIndexModal extends PureComponent {
  static displayName = 'DropIndexModal';

  static propTypes = {
    dataService: PropTypes.object,
    isVisible: PropTypes.bool.isRequired,
    inProgress: PropTypes.bool.isRequired,
    error: PropTypes.string,
    name: PropTypes.string.isRequired,
    confirmName: PropTypes.string.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    toggleInProgress: PropTypes.func.isRequired,
    changeConfirmName: PropTypes.func.isRequired,
    resetForm: PropTypes.func.isRequired,
    dropIndex: PropTypes.func.isRequired,
  };

  onFormSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  /**
   * Clean up after a close events
   */
  handleClose(evt) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.props.toggleIsVisible(false);
    this.props.resetForm();
  }

  /**
   * Drop index and close modal when confirm is clicked.
   *
   * @param {Object} evt - The click event.
   */
  handleConfirm(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.dropIndex(this.props.name);
  }

  /**
   * Render drop confirmation modal.
   *
   * @returns {React.Component} drop confirmation modal.
   */
  render() {
    return (
      <ConfirmationModal
        title="Drop Index"
        open={this.props.isVisible}
        onConfirm={this.handleConfirm.bind(this)}
        onCancel={this.handleClose.bind(this)}
        buttonText="Drop"
        variant="danger"
        submitDisabled={this.props.confirmName !== this.props.name}
        className={styles['drop-index-modal']}
        trackingId="drop_index_modal"
      >
        <div>
          <p className={styles['drop-index-modal-confirm']}>
            <i className="fa fa-exclamation-triangle" aria-hidden="true" />
            Type the index name
            <strong> {this.props.name} </strong>
            to drop
          </p>
        </div>
        <form onSubmit={this.onFormSubmit.bind(this)}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              data-test-id="confirm-drop-index-name"
              value={this.props.confirmName}
              onChange={(evt) => this.props.changeConfirmName(evt.target.value)}
            />
          </div>
          {!(this.props.error === null || this.props.error === undefined) ? (
            <ModalStatusMessage
              icon="times"
              message={this.props.error}
              type="error"
            />
          ) : null}

          {this.props.inProgress &&
          (this.props.error === null || this.props.error === undefined) ? (
            <ModalStatusMessage
              icon="spinner"
              message="Drop in Progress"
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
  dataService: state.dataService,
  isVisible: state.isVisible,
  inProgress: state.inProgress,
  error: state.error,
  name: state.name,
  confirmName: state.confirmName,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropIndexModal = connect(mapStateToProps, {
  toggleIsVisible,
  toggleInProgress,
  clearError,
  handleError,
  changeName,
  changeConfirmName,
  dropIndex,
  resetForm,
})(DropIndexModal);

export default MappedDropIndexModal;
export { DropIndexModal };
