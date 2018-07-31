import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';
import classnames from 'classnames';

import styles from './auto-update.less';

const NOT_NOW = 'Not Now';

class AutoUpdate extends PureComponent {
  static displayName = 'AutoUpdateComponent';

  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    version: PropTypes.string.isRequired,
    cancelUpdate: PropTypes.func.isRequired
  };

  /**
   * When cancel is requested.
   */
  onCancel = () => {
    this.props.cancelUpdate();
  }

  /**
   * When update is requested.
   */
  onUpdate = () => {
    const ipc = require('hadron-ipc');
    ipc.call('app:install-update');
    this.props.cancelUpdate();
  }

  onClickReleaseNotes = (evt) => {
    evt.preventDefault();
  }

  /**
   * Render the Auto Update component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const className = classnames({
      [styles['auto-update']]: true,
      [styles['auto-update-is-visible']]: true
    });

    return (
      <div className={className}>
        <div className={classnames(styles['auto-update-text'])}>
          <span className={classnames(styles['auto-update-text-available'])}>
            Compass version {this.props.version} is now available!
            Would you like to install and restart Compass?
          </span>
          <span>
            Read <a onClick={this.onClickReleaseNotes}>Release Notes</a>
          </span>
        </div>
        <TextButton
          className="btn btn-default btn-xs"
          text="Update Compass"
          clickHandler={this.onUpdate} />
        <div className={classnames(styles['auto-update-cancel'])} onClick={this.onCancel}>
          {NOT_NOW}
        </div>
      </div>
    );
  }
}

export default AutoUpdate;
