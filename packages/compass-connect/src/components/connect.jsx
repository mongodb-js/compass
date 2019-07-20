import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import shellToURL from 'mongodb-shell-to-url';
import Connection from 'mongodb-connection-model';
import Sidebar from './sidebar';
import ConnectForm from './form';
import Actions from 'actions';
import classnames from 'classnames';

import styles from './connect.less';

const Clipboard = remote.clipboard;
const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;

class Connect extends React.Component {
  static displayName = 'Connect';

  static propTypes = {
    currentConnection: PropTypes.object,
    connections: PropTypes.object,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    errorMessage: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.dialogOpen = false;
    this.checkClipboard = this.onCheckClipboard.bind(this);
  }

  componentDidMount() {
    window.addEventListener('focus', this.checkClipboard);
    document.title = `${remote.app.getName()} - Connect`;
    this.checkClipboard();
  }

  componentWillUnmount() {
    window.removeEventListener('focus', this.checkClipboard);
  }

  /**
   * Checks whether the clipboard has URI.
   */
  onCheckClipboard() {
    let clipboardText = (Clipboard.readText() || '').trim();
    const url = shellToURL(clipboardText);

    if (url) clipboardText = url;

    if ((clipboardText === this.clipboardText) || this.dialogOpen) {
      return;
    }

    if (Connection.isURI(clipboardText)) {
      this.dialogOpen = true;
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        message: 'MongoDB connection string detected',
        detail: 'Compass detected a MongoDB connection string in your '
          + 'clipboard. Do you want to use the connection string to '
          + 'fill out this form?',
        buttons: ['Yes', 'No']
      }, (response) => {
        this.dialogOpen = false;
        this.clipboardText = clipboardText;

        if (response === 0) {
          this.autoFillFromClipboard();
        }
      });
    }
  }

  /**
   * Parses a connection string from the clipboard.
   */
  autoFillFromClipboard() {
    Connection.from(this.clipboardText, (error, connection) => {
      if (!error) {
        connection.name = '';

        if (this.clipboardText.match(/[?&]ssl=true/i)) {
          connection.sslMethod = 'SYSTEMCA';
        }

        Actions.onConnectionSelected(connection);
      }
    });
  }

  /**
   * Renders a component with messages.
   *
   * @returns {React.Component}
   */
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
    const Status = global.hadronApp.appRegistry
      .getRole('Application.Status')[0].component;

    return (
      <div>
        <Status />
        <div className={classnames(styles.page, styles.connect)}>
          <Sidebar {...this.props} />
          <div className={classnames(styles['form-container'])}>
            <header>
              <h2 data-test-id="connect-header">Connect to Host</h2>
            </header>
            {this.renderMessage()}
            <ConnectForm {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

export default Connect;
