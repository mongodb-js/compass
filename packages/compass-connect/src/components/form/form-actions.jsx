import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import { FormInput } from 'hadron-react-components';
import { shell } from 'electron';
import FormGroup from './form-group';
import classnames from 'classnames';

import styles from '../connect.less';

const DEFAULT_NAME = 'Local';

class FormActions extends React.Component {
  static displayName = 'FormActions';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isConnected: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.isNameChanged = false;
  }

  /**
   * Creates a favorite.
   */
  onCreateFavorite() {
    Actions.onCreateFavorite();
  }

  /**
   * Deletes a favorite.
   */
  onDeleteFavorite() {
    Actions.onDeleteConnection(this.props.currentConnection);
  }

  /**
   * Saves a favorite.
   */
  onSaveFavorite() {
    Actions.onSaveConnection(this.props.currentConnection);
  }

  /**
   * Handles a connect click.
   *
   * @param {Object} evt - evt.
   */
  onConnectClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onConnect();
  }

  /**
   * Handles a disconnect click.
   *
   * @param {Object} evt - evt.
   */
  onDisconnectClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onDisconnect();
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
   * Renders "Create Favorite" button.
   *
   * @returns {React.Component}
   */
  renderCreateFavorite() {
    if (this.getName() !== '' && !this.props.currentConnection.isFavorite) {
      return (
        <button
          type="button"
          className="btn btn-sm btn-default"
          onClick={this.onCreateFavorite.bind(this)}>
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
          className="btn btn-sm btn-default"
          onClick={this.onDeleteFavorite.bind(this)}>
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
          className="btn btn-sm btn-default"
          onClick={this.onSaveFavorite.bind(this)}>
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
          data-test-id="connect-button"
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

  render() {
    return (
      <FormGroup id="favorite">
        <FormInput
          label="Favorite Name"
          name="favoriteName"
          placeholder="e.g. Shared Dev, QA Box, PRODUCTION"
          linkHandler={this.onNameHelp.bind(this)}
          changeHandler={this.onNameChanged.bind(this)}
          value={this.getName()} />
        <div className={classnames(styles.buttons)}>
          {this.renderCreateFavorite()}
          {this.renderDeleteFavorite()}
          {this.renderSaveFavorite()}
          {this.renderConnect()}
        </div>
      </FormGroup>
    );
  }
}

export default FormActions;
