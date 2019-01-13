import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { ModalStatusMessage } from 'hadron-react-components';
import { changeDatabaseName } from 'modules/drop-database/name';
import { changeDatabaseNameConfirmation } from 'modules/drop-database/name-confirmation';
import { dropDatabase } from 'modules/drop-database';
import { toggleIsVisible } from 'modules/is-visible';

import styles from './drop-database-modal.less';

/**
 * The modal to drop a database.
 */
class DropDatabaseModal extends PureComponent {
  static displayName = 'DropDatabaseModalComponent';

  static propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    nameConfirmation: PropTypes.string.isRequired,
    error: PropTypes.object,
    changeDatabaseName: PropTypes.func.isRequired,
    changeDatabaseNameConfirmation: PropTypes.func.isRequired,
    dropDatabase: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
  }

  /**
   * Called when the db name changes.
   *
   * @param {Object} evt - The event.
   */
  onNameChange = (evt) => {
    this.props.changeDatabaseName(evt.target.value);
  }

  /**
   * Called when the db name confirmation changes.
   *
   * @param {Object} evt - The event.
   */
  onNameConfirmationChange = (evt) => {
    this.props.changeDatabaseNameConfirmation(evt.target.value);
  }

  /**
   * Hide the modal.
   */
  onHide = () => {
    this.props.toggleIsVisible(false);
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal
        show={this.props.isVisible}
        backdrop="static"
        onHide={this.onHide}
        dialogClassName={classnames(styles['drop-database-modal'])}>

        <Modal.Header>
          <Modal.Title>Drop Database</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className={classnames(styles['drop-database-modal-confirm'])}>
              <i className="drop-confirm-icon fa fa-exclamation-triangle" aria-hidden="true"></i>
              To drop
              <span className={classnames(styles['drop-database-modal-confirm-namespace'])}>
                {this.props.name}]
              </span>
              type the database name
              <span className={classnames(styles['drop-database-modal-confirm-database'])}>
                {this.props.name}
              </span>
            </p>
          </div>
          <form
            name="drop-database-modal-form"
            onSubmit={this.props.dropDatabase}
            data-test-id="drop-database-modal">
            <div className="form-group">
              <input
                autoFocus
                type="text"
                className="form-control"
                data-test-id="confirm-drop-database-name"
                value={this.props.nameConfirmation}
                onChange={this.onNameConfirmationChange} />
            </div>
            {this.props.error ?
              <ModalStatusMessage icon="times" message={this.props.error.message} type="error" />
              : null}
            {this.props.isRunning ?
              <ModalStatusMessage icon="spinner" message="Drop in Progress" type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="cancel-drop-database-button"
            text="Cancel"
            clickHandler={this.onHide} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="drop-database-button"
            disabled={this.props.name !== this.props.nameConfirmation}
            text="Drop Database"
            clickHandler={this.props.dropDatabase} />
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
  nameConfirmation: state.nameConfirmation,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropDatabaseModal = connect(
  mapStateToProps,
  {
    changeDatabaseName,
    changeDatabaseNameConfirmation,
    dropDatabase,
    toggleIsVisible
  },
)(DropDatabaseModal);

export default MappedDropDatabaseModal;
export { DropDatabaseModal };
