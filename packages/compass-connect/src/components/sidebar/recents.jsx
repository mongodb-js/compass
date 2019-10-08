import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import moment from 'moment';
import Actions from 'actions';
import classnames from 'classnames';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import styles from './sidebar.less';

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Recents extends React.Component {
  static displayName = 'Recents';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    connections: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array
    ]).isRequired
  };

  /**
   * Selects a recent connection.
   *
   * @param {Object} recent - A recent connection.
   */
  onRecentClicked(recent) {
    Actions.onConnectionSelected(recent);
  }

  /**
   * Deletes a recent connection.
   *
   * @param {Object} recent - A recent connection.
   */
  onClearConnectionClicked(recent) {
    Actions.onDeleteConnectionClicked(recent);
  }

  /**
   * Deletes connections.
   */
  onClearConnectionsClicked() {
    Actions.onDeleteConnectionsClicked();
  }

  /**
   * Gets a proper class name for active and not active recent connections.
   *
   * @param {Object} recent - A recent connection.
   *
   * @returns {String} - A class name
   */
  getClassName(recent) {
    const classnamesProps = [styles['connect-sidebar-list-item']];

    if (this.props.currentConnection === recent) {
      classnamesProps.push(styles['connect-sidebar-list-item-is-active']);
    }

    return classnames(...classnamesProps);
  }

  /**
   * Formats lastUsed.
   *
   * @param {Object} model - A connection model.
   *
   * @returns {String} - A last used moment.
   */
  formatLastUsed(model) {
    if (!model.lastUsed) {
      return 'Never';
    }

    if ((new Date() - model.lastUsed) < TWO_DAYS) {
      return moment(model.lastUsed).fromNow();
    }

    return moment(model.lastUsed).format('lll');
  }

  /**
   * Render recent connections.
   *
   * @returns {React.Component}
   */
  renderRecents() {
    const recents = this.props.connections
      .filter((connection) => !connection.isFavorite);

    return map(recents, (recent, i) => {
      const title = `${recent.hostname}:${recent.port}`;

      return (
        <li
          className={this.getClassName(recent)}
          key={i}
          title={title}
          onClick={this.onRecentClicked.bind(this, recent)}>
          <div className={classnames(styles['connect-sidebar-list-item-details'])}>
            <div className={classnames(styles['connect-sidebar-list-item-last-used'])}>
              {this.formatLastUsed(recent)}
            </div>
            <div className={classnames(styles['connect-sidebar-list-item-name'])}>
              {title}
            </div>
          </div>
          <DropdownButton
            bsSize="xsmall"
            bsStyle="link"
            title="&hellip;"
            className={classnames(styles['connect-sidebar-list-item-actions'])}
            noCaret
            pullRight
            id="recent-actions">
            <MenuItem eventKey="1" onClick={this.onClearConnectionClicked.bind(this, recent)}>Remove</MenuItem>
          </DropdownButton>
        </li>
      );
    });
  }

  render() {
    const recents = this.props.connections
      .filter((connection) => !connection.isFavorite);
    const clearClassName = classnames(styles['connect-sidebar-header-recent-clear']);
    const clearAllDiv = recents.length > 0
      ? <div onClick={this.onClearConnectionsClicked} className={clearClassName}>Clear all</div>
      : '';

    return (
      <div className="connect-sidebar-connections-recents">
        <div className={classnames(styles['connect-sidebar-header'])}>
          <div className={classnames(styles['connect-sidebar-header-recent'])}>
            <div>
              <i className="fa fa-fw fa-history" />
              <span>Recents</span>
            </div>
            {clearAllDiv}
          </div>
        </div>
        <ul className={classnames(styles['connect-sidebar-list'])}>
          {this.renderRecents()}
        </ul>
      </div>
    );
  }
}

export default Recents;
