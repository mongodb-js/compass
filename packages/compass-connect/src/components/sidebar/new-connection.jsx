import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import classnames from 'classnames';

import styles from './sidebar.less';

class NewConnection extends React.Component {
  static displayName = 'NewConnection';

  static propTypes = { currentConnection: PropTypes.object.isRequired };

  /**
   * Resets connection when new connection clicked.
   */
  onNewConnectionClicked() {
    Actions.resetConnection();
  }

  /**
   * Gets a proper class name according to current connection conditions.
   *
   * @returns {String} - A class name
   */
  getClassName() {
    const connection = this.props.currentConnection;
    const classnamesProps = [styles['connect-sidebar-new-connection']];

    if (!connection || (!connection.is_favorite && !connection.last_used)) {
      classnamesProps.push(styles['connect-sidebar-new-connection-is-active']);
    }

    return classnames(...classnamesProps);
  }

  render() {
    return (
      <div className={this.getClassName()}>
        <div
          className={classnames(styles['connect-sidebar-header'])}
          onClick={this.onNewConnectionClicked.bind(this)}>
          <i className="fa fa-fw fa-bolt" />
          <span>New Connection</span>
        </div>
      </div>
    );
  }
}

export default NewConnection;
