const React = require('react');
const PropTypes = require('prop-types');
const { remote } = require('electron');
const Clipboard = remote.clipboard;
const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;
const shellToURL = require('mongodb-shell-to-url');
const Connection = require('../models/connection');
const Sidebar = require('./sidebar');
const ConnectForm = require('./form');
const Actions = require('../actions');

class Connect extends React.Component {

  constructor(props) {
    super(props);
    this.checkClipboard = this.onCheckClipboard.bind(this);
  }

  componentDidMount() {
    window.onfocus = this.checkClipboard;
    this.checkClipboard();
  }

  componentWillUnmount() {
    window.removeEventListener('onfocus', this.checkClipboard);
  }

  onCheckClipboard() {
    let clipboardText = Clipboard.readText();
    const url = shellToURL(clipboardText);

    if (url) clipboardText = url;
    if (clipboardText === this.clipboardText) return;

    if (Connection.isURI(clipboardText)) {
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        message: 'MongoDB connection string detected',
        detail: 'Compass detected a MongoDB connection string in your '
          + 'clipboard. Do you want to use the connection string to '
          + 'fill out this form?',
        buttons: ['Yes', 'No']
      }, (response) => {
        this.clipboardText = clipboardText;
        if (response === 0) {
          this.autoFillFromClipboard();
        }
      });
    }
  }

  autoFillFromClipboard() {
    const connection = Connection.from(this.clipboardText);
    connection.name = '';

    if (this.clipboardText.match(/[?&]ssl=true/i)) {
      connection.ssl = 'SYSTEMCA';
    }
    Actions.onConnectionSelected(connection);
  }

  renderMessage() {
    if (!this.props.isValid && this.props.errorMessage) {
      return (
        <div className="message error">
          <p>{this.props.errorMessage}</p>
        </div>
      );
    } else if (this.props.isConnected) {
      const connection = this.props.currentConnection;
      const server = `${connection.hostname}:${connection.port}`;
      return (
        <div className="message success">
          <p>Connected to {server}</p>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="page connect">
        <Sidebar {...this.props} />
        <div className="form-container">
          <header>
            <h2 data-test-id="connect-header">Connect to Host</h2>
          </header>
          {this.renderMessage()}
          <ConnectForm {...this.props} />
        </div>
      </div>
    );
  }
}

Connect.propTypes = {
  currentConnection: PropTypes.object,
  connections: PropTypes.object,
  isValid: PropTypes.bool,
  isConnected: PropTypes.bool,
  errorMessage: PropTypes.string
};

Connect.displayName = 'Connect';

module.exports = Connect;
