import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Actions from '../../actions';

import styles from './sidebar.less';

class NewConnection extends React.Component {
  static displayName = 'NewConnection';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    connections: PropTypes.object.isRequired
  };

  /**
   * Resets connection when new connection clicked.
   */
  onNewConnectionClicked() {
    Actions.onResetConnectionClicked();
  }

  /**
   * Gets a proper class name according to current connection conditions.
   *
   * @returns {String} - A class name
   */
  getClassName() {
    const currentSaved = this.props.connections[this.props.connectionModel._id];
    const classnamesProps = [styles['connect-sidebar-new-connection']];

    if (!currentSaved) {
      classnamesProps.push(styles['connect-sidebar-new-connection-is-active']);
    }

    return classnames(...classnamesProps);
  }

  render() {
    return (
      <div className={this.getClassName()}>
        <button
          data-test-id="new-connection-button"
          className={classnames(
            styles['connect-sidebar-header'],
            styles['connect-sidebar-new-connection-button']
          )}
          onClick={this.onNewConnectionClicked.bind(this)}
        >
          {/* There is no leafygreen replacement for this icon */}
          <i className="fa fa-fw fa-bolt" />
          <span>New Connection</span>
        </button>
      </div>
    );
  }
}

export default NewConnection;
