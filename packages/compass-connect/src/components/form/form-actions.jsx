const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');
const { shell } = require('electron');
const FormGroup = require('./form-group');

const DEFAULT_NAME = 'Local';

class FormActions extends React.Component {

  constructor(props) {
    super(props);
    this.isNameChanged = false;
  }

  onCreateFavorite() {
    Actions.onCreateFavorite();
  }

  onDeleteFavorite() {
    Actions.onDeleteConnection(this.props.currentConnection);
  }

  onSaveFavorite() {
    Actions.onSaveConnection(this.props.currentConnection);
  }

  onConnectClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.onConnect();
  }

  onNameChanged(evt) {
    this.isNameChanged = true;
    Actions.onFavoriteNameChanged(evt.target.value);
  }

  onNameHelp() {
    shell.openExternal('https://docs.mongodb.com/compass/current/connect/');
  }

  getName() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isNameChanged && connection.name === DEFAULT_NAME) {
      return '';
    }
    return connection.name;
  }

  renderCreateFavorite() {
    if (this.getName() !== '' && !this.props.currentConnection.is_favorite) {
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

  renderDeleteFavorite() {
    if (this.props.currentConnection.is_favorite) {
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

  renderSaveFavorite() {
    if (this.props.currentConnection.is_favorite) {
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

  renderConnect() {
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

  render() {
    return (
      <FormGroup id="favorite">
        <FormInput
          label="Favorite Name"
          name="favorite_name"
          placeholder="e.g. Shared Dev, QA Box, PRODUCTION"
          linkHandler={this.onNameHelp.bind(this)}
          changeHandler={this.onNameChanged.bind(this)}
          value={this.getName()} />
        <div className="buttons">
          {this.renderCreateFavorite()}
          {this.renderDeleteFavorite()}
          {this.renderSaveFavorite()}
          {this.renderConnect()}
        </div>
      </FormGroup>
    );
  }
}

FormActions.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

FormActions.displayName = 'FormActions';

module.exports = FormActions;
