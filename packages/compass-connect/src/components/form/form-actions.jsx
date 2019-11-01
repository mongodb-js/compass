import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormGroup from './form-group';
import classnames from 'classnames';

import styles from '../connect.less';

class FormActions extends React.Component {
  static displayName = 'FormActions';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    errorMessage: PropTypes.string,
    syntaxErrorMessage: PropTypes.string,
    hasUnsavedChanges: PropTypes.bool,
    viewType: PropTypes.string
  };

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
   * Discards favorite changes.
   *
   * @param {Object} evt - evt.
   */
  onFavoriteChangeDiscarded(evt) {
    evt.preventDefault();
    Actions.onFavoriteChangeDiscarded();
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
    return (!this.props.isValid && this.props.syntaxErrorMessage);
  }

  /**
   * Checks for an server error.
   *
   * @returns {Boolean} True in case of a server error.
   */
  hasError() {
    return (!this.props.isValid && this.props.errorMessage);
  }

  /**
   * Renders a warning that a favorite was changed and changes can be saved
   * or discarded.
   *
   * @returns {React.Component}
   */
  renderUnsavedMessage() {
    return (
      <div className={classnames(styles['unsaved-message-actions'])}>
        You have unsaved changes.
        <a onClick={this.onFavoriteChangeDiscarded}>[Discard]</a>
        <a onClick={this.onSaveFavoriteClicked}>[Save changes]</a>
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
      <button
        type="submit"
        name="disconnect"
        className="btn btn-sm btn-primary"
        onClick={this.onDisconnectClicked.bind(this)}>
        Disconnect
      </button>
    );
  }

  /**
   * Renders "Connect" button.
   *
   * @returns {React.Component}
   */
  renderConnect = () => {
    return (
      <button
        type="submit"
        name="connect"
        className="btn btn-sm btn-primary"
        onClick={this.onConnectClicked.bind(this)}>
        Connect
      </button>
    );
  }

  /**
   * Renders connect or disconnect button depending on state.
   *
   * @returns {React.Component}
   */
  renderConnectButtons() {
    return (
      <div className={classnames(styles.buttons)}>
        {this.props.isConnected ? this.renderDisconnect() : this.renderConnect()}
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
    } else if (this.hasSyntaxError() && this.props.viewType === 'connectionString') {
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
            <div className={styles['connection-message']}>
              {message}
            </div>
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
