import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { ModalStatusMessage } from 'hadron-react-components';
import { changeCollectionName } from 'modules/drop-collection/name';
import { changeCollectionNameConfirmation } from 'modules/drop-collection/name-confirmation';
import { dropCollection } from 'modules/drop-collection';
import { toggleIsVisible } from 'modules/is-visible';

import styles from './drop-collection-modal.less';

/**
 * The modal to drop a collection.
 */
class DropCollectionModal extends PureComponent {
  static displayName = 'DropCollectionModalComponent';

  static propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    nameConfirmation: PropTypes.string.isRequired,
    error: PropTypes.object,
    changeCollectionNameConfirmation: PropTypes.func.isRequired,
    dropCollection: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
  }

  /**
   * Called when the db name confirmation changes.
   *
   * @param {Object} evt - The event.
   */
  onNameConfirmationChange = (evt) => {
    this.props.changeCollectionNameConfirmation(evt.target.value);
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
      this.props.dropCollection();
    }
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
        dialogClassName={classnames(styles['drop-collection-modal'])}>

        <Modal.Header>
          <Modal.Title>Drop Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className={classnames(styles['drop-collection-modal-confirm'])}>
              <i className="fa fa-exclamation-triangle" aria-hidden="true" />
              To drop
              <span className={classnames(styles['drop-collection-modal-confirm-namespace'])}>
                {this.props.name}
              </span>
              type the collection name
              <span className={classnames(styles['drop-collection-modal-confirm-name'])}>
                {this.props.name}
              </span>.
            </p>
          </div>
          <form
            name="drop-collection-modal-form"
            onSubmit={this.onFormSubmit}
            data-test-id="drop-collection-modal">
            <div className="form-group">
              <input
                autoFocus
                type="text"
                className="form-control"
                data-test-id="confirm-drop-collection-name"
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
            dataTestId="cancel-drop-collection-button"
            text="Cancel"
            clickHandler={this.onHide} />
          <TextButton
            className="btn btn-alert btn-sm"
            dataTestId="drop-collection-button"
            disabled={this.props.name !== this.props.nameConfirmation}
            text="Drop Collection"
            clickHandler={this.props.dropCollection} />
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
const MappedDropCollectionModal = connect(
  mapStateToProps,
  {
    changeCollectionName,
    changeCollectionNameConfirmation,
    dropCollection,
    toggleIsVisible
  },
)(DropCollectionModal);

export default MappedDropCollectionModal;
export { DropCollectionModal };
