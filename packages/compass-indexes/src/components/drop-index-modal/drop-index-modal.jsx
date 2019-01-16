import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { ModalStatusMessage } from 'hadron-react-components';

import classnames from 'classnames';
import styles from './drop-index-modal.less';

import { toggleIsVisible } from 'modules/is-visible';
import { toggleInProgress } from 'modules/in-progress';
import { changeName } from 'modules/drop-index/name';
import { changeConfirmName } from 'modules/drop-index/confirm-name';
import { handleError, clearError } from 'modules/error';
import { dropIndex } from 'modules/drop-index';
import { resetForm } from 'modules/reset-form';

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
    dropIndex: PropTypes.func.isRequired
  };

  /**
   * Clean up after a close events
   */
  handleClose() {
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
      <Modal show={this.props.isVisible}
        backdrop="static"
        dialogClassName={classnames(styles['drop-index-modal'])}
        onHide={this.handleClose.bind(this)} >

        <Modal.Header>
          <Modal.Title>Drop Index</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className={classnames(styles['drop-index-modal-confirm'])}>
              <i className="fa fa-exclamation-triangle" aria-hidden="true"/>
              Type the index name
              <strong> {this.props.name} </strong>
              to drop
            </p>
          </div>
          <form>
            <div className="form-group">
              <input
                autoFocus
                type="text"
                className="form-control"
                data-test-id="confirm-drop-index-name"
                value={this.props.confirmName}
                onChange={(evt) => (this.props.changeConfirmName(evt.target.value))} />
            </div>
            {!(this.props.error === null || this.props.error === undefined) ?
              <ModalStatusMessage icon="times" message={this.props.error} type="error" />
              : null}

            {this.props.inProgress && (this.props.error === null || this.props.error === undefined) ?
              <ModalStatusMessage icon="spinner" message="Drop in Progress" type="in-progress" />
              : null}

            <div className={classnames(styles['drop-index-modal-buttons'])}>
              <button
                className="btn btn-default btn-sm"
                data-test-id="cancel-drop-index-button"
                type="button"
                onClick={this.handleClose.bind(this)}>
                Cancel
              </button>
              <button
                className="btn btn-alert btn-sm"
                data-test-id="drop-index-button"
                disabled={this.props.confirmName !== this.props.name}
                type="button"
                onClick={this.handleConfirm.bind(this)}>
                Drop
              </button>
            </div>
          </form>
        </Modal.Body>
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
  dataService: state.dataService,
  isVisible: state.isVisible,
  inProgress: state.inProgress,
  error: state.error,
  name: state.name,
  confirmName: state.confirmName
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropIndexModal = connect(
  mapStateToProps,
  {
    toggleIsVisible,
    toggleInProgress,
    clearError,
    handleError,
    changeName,
    changeConfirmName,
    dropIndex,
    resetForm
  },
)(DropIndexModal);

export default MappedDropIndexModal;
export { DropIndexModal };
