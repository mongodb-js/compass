const React = require('react');
const PropTypes = require('prop-types');
const { remote } = require('electron');
const Clipboard = remote.clipboard;
const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;
const shellToURL = require('mongodb-shell-to-url');
const Connection = require('mongodb-connection-model');
const AuthenticationSection = require('./authentication-section');
const HostPortSection = require('./host-port-section');
const ReplicaSetNameReadPreferenceSection = require('./replica-set-name-read-preference-section');
const SSLSection = require('./ssl-section');
const FavoriteSection = require('./favorite-section');
const Sidebar = require('./sidebar');
const SSHTunnelSection = require('./ssh-tunnel-section');
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
        if (response === 0) {
          this.clipboardText = clipboardText;
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

  render() {
    return (
      <div className="page connect">
        <Sidebar {...this.props} />
        <div className="form-container">
          <header>
            <h2 data-test-id="connect-header">Connect to Host</h2>
          </header>
          <form data-test-id="connect-form">
            <HostPortSection {...this.props} />
            <hr />
            <AuthenticationSection {...this.props} />
            <hr />
            <ReplicaSetNameReadPreferenceSection {...this.props} />
            <hr />
            <SSLSection {...this.props} />
            <hr />
            <SSHTunnelSection {...this.props} />
            <hr />
            <FavoriteSection {...this.props } />
          </form>
        </div>
      </div>
    );
  }
}

Connect.propTypes = {
  currentConnection: PropTypes.object,
  connections: PropTypes.object
};

Connect.displayName = 'Connect';

module.exports = Connect;
