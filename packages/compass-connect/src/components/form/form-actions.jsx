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

  constructor(props) {
    super(props);
    this.isNameChanged = false;
  }

  /**
   * Creates a favorite.
   */
  onCreateFavoriteClicked() {
    Actions.onCreateFavoriteClicked();
  }

  /**
   * Deletes a favorite.
   */
  onDeleteFavoriteClicked() {
    Actions.onDeleteConnectionClicked(this.props.currentConnection);
  }

  /**
   * Saves a favorite.
   */
  onSaveFavoriteClicked() {
    Actions.onSaveConnectionClicked(this.props.currentConnection);
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
   * Handles a name change.
   *
   * @param {Object} evt - evt.
   */
  onNameChanged(evt) {
    this.isNameChanged = true;
    Actions.onFavoriteNameChanged(evt.target.value);
  }

  /**
   * Opens a documentation about connecting to MongoDB.
   */
  onNameHelp() {
    shell.openExternal('https://docs.mongodb.com/compass/current/connect/');
  }

  /**
   * Gets a name of the current connection.
   *
   * @returns {String} A connection.name.
   */
  getName() {
    const connection = this.props.currentConnection;

    if (
      !connection.lastUsed &&
      !this.isNameChanged &&
      (connection.name === DEFAULT_NAME)
    ) {
      return '';
    }

    return connection.name;
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
   * Renders "Create Favorite" button.
   *
   * @returns {React.Component}
   */
  renderCreateFavorite() {
    if (this.getName() !== '' && !this.props.currentConnection.isFavorite) {
      return (
        <button
          type="button"
          name="createFavorite"
          key="createFavorite"
          className="btn btn-sm btn-default"
          onClick={this.onCreateFavoriteClicked.bind(this)}>
          Create Favorite
        </button>
      );
    }
  }

  /**
   * Renders "Delete Favorite" button.
   *
   * @returns {React.Component}
   */
  renderDeleteFavorite() {
    if (this.props.currentConnection.isFavorite) {
      return (
        <button
          type="button"
          name="deleteFavorite"
          key="deleteFavorite"
          className="btn btn-sm btn-default"
          onClick={this.onDeleteFavoriteClicked.bind(this)}>
          Delete Favorite
        </button>
      );
    }
  }

  /**
   * Renders "Save Favorite" button.
   *
   * @returns {React.Component}
   */
  renderSaveFavorite() {
    if (this.props.currentConnection.isFavorite) {
      return (
        <button
          type="button"
          name="saveFavorite"
          key="saveFavorite"
          className="btn btn-sm btn-default"
          onClick={this.onSaveFavoriteClicked.bind(this)}>
          Save Favorite
        </button>
      );
    }
  }

  /**
   * Renders "Connect" button.
   *
   * @returns {React.Component}
   */
  renderConnect() {
    if (!this.props.isConnected) {
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

  /**
   * Renders a favorite input.
   *
   * @returns {React.Component}
   */
  renderFavoriteInput() {
    if (this.props.viewType === 'connectionForm') {
      return (
        <div className={classnames(styles['favorite-container'])}>
          <FormInput
            label="Favorite Name"
            name="favoriteName"
            placeholder="e.g. Shared Dev, QA Box, PRODUCTION"
            linkHandler={this.onNameHelp.bind(this)}
            changeHandler={this.onNameChanged.bind(this)}
            value={this.getName()} />
        </div>
      );
    }
  }

  /**
   * Renders favorite buttons.
   *
   * @returns {React.Component}
   */
  renderFavoriteButtons() {
    if (this.props.viewType === 'connectionForm') {
      return [
        this.renderCreateFavorite(),
        this.renderDeleteFavorite(),
        this.renderSaveFavorite()
      ];
    }
  }

  render() {
    return (
      <FormGroup id="favorite">
        {this.renderFavoriteInput()}
        {this.renderMessage()}
        <div className={classnames(styles.buttons)}>
          {this.renderFavoriteButtons()}
          {this.renderConnect()}
        </div>
      </FormGroup>
    );
  }
}

export default FormActions;
