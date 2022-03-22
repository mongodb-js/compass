import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ModalStatusMessage } from 'hadron-react-components';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import { changeDatabaseName } from '../../modules/drop-database/name';
import { changeDatabaseNameConfirmation } from '../../modules/drop-database/name-confirmation';
import { dropDatabase } from '../../modules/drop-database';
import { toggleIsVisible } from '../../modules/is-visible';

import styles from './drop-database-modal.module.less';

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
   * When user hits enter to submit the form we need to prevent the default bhaviour.
   *
   * @param {Event} evt - The event.
   */
  onFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.props.name === this.props.nameConfirmation) {
      this.props.dropDatabase();
    }
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <ConfirmationModal
        title="Drop Database"
        open={this.props.isVisible}
        onConfirm={this.props.dropDatabase}
        onCancel={this.onHide}
        buttonText="Drop Database"
        variant="danger"
        submitDisabled={this.props.name !== this.props.nameConfirmation}
        className={styles['drop-database-modal']}
        trackingId="drop_database_modal"
      >
        <div>
          <p className={styles['drop-database-modal-confirm']}>
            <i className="fa fa-exclamation-triangle" aria-hidden="true" />
              To drop
            <span className={styles['drop-database-modal-confirm-namespace']}>
              {this.props.name}
            </span>
              type the database name
            <span className={styles['drop-database-modal-confirm-name']}>
              {this.props.name}
            </span>.
          </p>
        </div>
        <form
          name="drop-database-modal-form"
          onSubmit={this.onFormSubmit}
          data-test-id="drop-database-modal">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              data-test-id="confirm-drop-database-name"
              value={this.props.nameConfirmation}
              onChange={this.onNameConfirmationChange}
            />
          </div>
          {this.props.error ?
            <ModalStatusMessage icon="times" message={this.props.error.message} type="error" />
            : null}
          {this.props.isRunning ?
            <ModalStatusMessage icon="spinner" message="Drop in Progress" type="in-progress" />
            : null}
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
