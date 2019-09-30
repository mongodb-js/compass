import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormInput from './form-input';
import { shell } from 'electron';
import FormGroup from './form-group';
import classnames from 'classnames';

import styles from '../connect.less';

const DEFAULT_NAME = 'Local';

class FormActions extends React.Component {
  static displayName = 'FormActions';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    errorMessage: PropTypes.string,
    syntaxErrorMessage: PropTypes.string,
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
