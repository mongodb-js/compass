import Button from '@leafygreen-ui/button';
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Actions from '../../actions';
import FormGroup from './form-group';
import { CONNECTION_STRING_VIEW } from '../../constants/connection-views';

import styles from '../connect.less';

class FormActions extends React.Component {
  static displayName = 'FormActions';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    currentConnectionAttempt: PropTypes.object,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    errorMessage: PropTypes.string,
    syntaxErrorMessage: PropTypes.string,
    hasUnsavedChanges: PropTypes.bool,
    viewType: PropTypes.string,
    isURIEditable: PropTypes.bool,
    isSavedConnection: PropTypes.bool
  };

  onCancelConnectionAttemptClicked(evt) {
    evt.preventDefault();
    Actions.onCancelConnectionAttemptClicked();
  }

  /**
   * Handles a connect click.
   *
   * @param {Object} evt - evt.
   */
  onConnectClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onConnectClicked();
  }

  /**
   * Handles a disconnect click.
   *
   * @param {Object} evt - evt.
   */
  onDisconnectClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onDisconnectClicked();
  }

  /**
   * Discards changes.
   *
   * @param {Object} evt - evt.
   */
  onChangesDiscarded(evt) {
    evt.preventDefault();
    Actions.onChangesDiscarded();
  }

  /**
   * Shows an editable URI input.
   *
   * @param {Object} evt - evt.
   */
  onEditURIClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onEditURIClicked();
  }

  /**
   * Shows a read-only URI.
   *
   * @param {Object} evt - evt.
   */
  onHideURIClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onHideURIClicked();
  }

  /**
   * Updates favorite attributes if a favorite already exists.
   *
   * @param {Object} evt - evt.
   */
  onSaveFavoriteClicked(evt) {
    evt.preventDefault();
    Actions.onSaveFavoriteClicked();
  }

  /**
   * Checks for a syntax error.
   *
   * @returns {Boolean} True in case of a syntax error.
   */
  hasSyntaxError() {
    return !this.props.isValid && this.props.syntaxErrorMessage;
  }

  /**
   * Checks for an server error.
   *
   * @returns {Boolean} True in case of a server error.
   */
  hasError() {
    return !this.props.isValid && this.props.errorMessage;
  }

  /**
   * Renders a warning that a saved connection was changed and
   * changes can be saved or discarded. For recents changes
   * can not be saved, only discarded.
   *
   * @returns {React.Component}
   */
  renderUnsavedMessage() {
    return (
      <div className={classnames(styles['unsaved-message-actions'])}>
        You have unsaved changes.
        <a id="discardChanges" onClick={this.onChangesDiscarded}>
          [discard]
        </a>
        {this.props.currentConnection.isFavorite ? (
          <a id="saveChanges" onClick={this.onSaveFavoriteClicked}>
            [save changes]
          </a>
        ) : null}
      </div>
    );
  }

  /**
   * Renders "Disconnect" button.
   *
   * @returns {React.Component}
   */
  renderDisconnect = () => {
    return (
      <Button
        className={styles.button}
        type="submit"
        variant="primary"
        onClick={this.onDisconnectClicked.bind(this)}
      >
        Disconnect
      </Button>
    );
  };

  /**
   * Renders "Connect" button.
   *
   * @returns {React.Component}
   */
  renderConnect = () => {
    return (
      <Button
        className={styles.button}
        type="submit"
        name="connect"
        variant="primary"
        disabled={!!this.hasSyntaxError()}
        onClick={this.onConnectClicked.bind(this)}
      >
        Connect
      </Button>
    );
  };

  renderConnecting = () => {
    return (
      <React.Fragment>
        <Button
          className={styles.button}
          type="submit"
          name="cancelConnect"
          onClick={this.onCancelConnectionAttemptClicked.bind(this)}
        >
          Cancel
        </Button>
        <Button
          className={styles.button}
          type="submit"
          name="connecting"
          disabled
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className={styles['btn-loading']} />Connecting...
        </Button>
      </React.Fragment>
    );
  };

  /**
   * Renders the "Edit" button.
   *
   * @returns {React.Component}
   */
  renderEditURI = () => {
    if (this.props.viewType === CONNECTION_STRING_VIEW) {
      return (
        <Button
          className={styles.button}
          type="submit"
          name="editUrl"
          onClick={this.onEditURIClicked.bind(this)}
        >
          Edit
        </Button>
      );
    }
  };

  /**
   * Renders the "Hide" button.
   *
   * @returns {React.Component}
   */
  renderHideURI = () => {
    if (
      this.props.isSavedConnection &&
      !this.props.hasUnsavedChanges &&
      this.props.viewType === CONNECTION_STRING_VIEW
    ) {
      return (
        <Button
          className={styles.button}
          type="submit"
          name="hideUrl"
          onClick={this.onHideURIClicked.bind(this)}
        >
          Hide
        </Button>
      );
    }
  };

  /**
   * Renders connect or disconnect button depending on state.
   *
   * @returns {React.Component}
   */
  renderConnectButtons() {
    return (
      <div className={classnames(styles.buttons)}>
        {!this.props.currentConnectionAttempt && (
          this.props.isURIEditable
            ? this.renderHideURI()
            : this.renderEditURI()
        )}
        {this.props.isConnected && this.renderDisconnect()}
        {!this.props.isConnected && !this.props.currentConnectionAttempt && this.renderConnect()}
        {!this.props.isConnected && !!this.props.currentConnectionAttempt && this.renderConnecting()}
      </div>
    );
  }

  /**
   * Renders a component with messages.
   *
   * @returns {React.Component}
   */
  renderMessage() {
    const connection = this.props.currentConnection;
    const server = `${connection.hostname}:${connection.port}`;
    let message = `Connected to ${server}`;
    let colorStyle = styles['connection-message-container-success'];
    let hasMessage = false;

    if (this.hasError()) {
      hasMessage = true;
      message = this.props.errorMessage;
      colorStyle = styles['connection-message-container-error'];
    } else if (
      this.hasSyntaxError() &&
      this.props.viewType === CONNECTION_STRING_VIEW
    ) {
      hasMessage = true;
      message = this.props.syntaxErrorMessage;
      colorStyle = styles['connection-message-container-syntax-error'];
    } else if (this.props.isConnected) {
      hasMessage = true;
    } else if (this.props.hasUnsavedChanges) {
      hasMessage = true;
      message = this.renderUnsavedMessage();
      colorStyle = styles['connection-message-container-unsaved-message'];
    }

    if (hasMessage === true) {
      return (
        <div className={styles['connection-message-container']}>
          <div className={classnames(colorStyle)}>
            <div className={styles['connection-message']}>{message}</div>
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <FormGroup id="favorite">
        {this.renderMessage()}
        {this.renderConnectButtons()}
      </FormGroup>
    );
  }
}

export default FormActions;
