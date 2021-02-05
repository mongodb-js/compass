import Button from '@leafygreen-ui/button';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

import Actions from '../../actions';
import styles from '../connect.less';

/**
 * Question text.
 */
const QUESTION = 'Are you sure you want to edit your connection string?';

/**
 * The note.
 */
const NOTE = 'Editing this connection string will reveal your credentials.';

/**
 * Confirm edit a connection string modal.
 */
class ConfirmEditConnectionString extends PureComponent {
  static propTypes = {
    isEditURIConfirm: PropTypes.bool.isRequired
  };

  /**
   * Handles clicks on the `Confirm` button.
   */
  onConfirm = () => {
    Actions.onEditURIConfirmed();
  };

  /**
   * Closes the current modal.
   */
  onClose = () => {
    Actions.onEditURICanceled();
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.isEditURIConfirm}>
        <Modal.Header closeButton onHide={this.onClose}>
          <h4>{QUESTION}</h4>
        </Modal.Header>
        <Modal.Body>
          <div id="edit-uri-note">{NOTE}</div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={this.onClose}
          >Cancel</Button>
          <Button
            className={styles['confirm-edit-modal-button']}
            variant="primary"
            onClick={this.onConfirm}
          >Confirm</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ConfirmEditConnectionString;
