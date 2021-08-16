import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import Actions from '../../actions';

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
      <ConfirmationModal
        title={QUESTION}
        open={this.props.isEditURIConfirm}
        onConfirm={this.onConfirm}
        onCancel={this.onClose}
        buttonText="Confirm"
      >
        <div id="edit-uri-note">{NOTE}</div>
      </ConfirmationModal>
    );
  }
}

export default ConfirmEditConnectionString;
