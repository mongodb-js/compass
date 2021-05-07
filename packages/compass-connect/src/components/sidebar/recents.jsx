import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import Actions from '../../actions';

import styles from './sidebar.less';

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Recents extends React.Component {
  static displayName = 'Recents';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    connections: PropTypes.object.isRequired
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
   * Selects and connects to a recent connection.
   *
   * @param {Object} recent - A recent connection.
   */
  onRecentDoubleClicked(recent) {
    Actions.onConnectionSelectAndConnect(recent);
  }

  /**
   * Deletes a recent connection.
   *
   * @param {Object} recent - A recent connection.
   * @param {Object} evt - evt.
   */
  onRemoveConnectionClicked(recent, evt) {
    evt.stopPropagation();
    Actions.onDeleteConnectionClicked(recent);
  }

  /**
   * Deletes connections.
   */
  onClearConnectionsClicked() {
    Actions.onDeleteConnectionsClicked();
  }

  /**
   * Saves a recent connection to favorites.
   *
   * @param {Object} recent - A recent connection.
   * @param {Object} evt - evt.
   */
  onSaveAsFavoriteClicked(recent, evt) {
    evt.stopPropagation();
    Actions.onSaveAsFavoriteClicked(recent);
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

    if (new Date() - model.lastUsed < TWO_DAYS) {
      return moment(model.lastUsed).fromNow();
    }

    return moment(model.lastUsed).format('lll');
  }

  /**
   * Render recent connections.
   *
   * @param {Object} recents - The recent connections.
   *
   * @returns {React.Component}
   */
  renderRecents(recents) {
    return map(recents, (recent, i) => {
      const title = `${recent.hostname}:${recent.port}`;

      return (
        <li
          className={classnames(styles['connect-sidebar-list-item'], {
            [styles['connect-sidebar-list-item-is-active']]: this.props.connectionModel._id === recent._id
          })}
          key={i}
          title={title}
          onClick={this.onRecentClicked.bind(this, recent)}
          onDoubleClick={this.onRecentDoubleClicked.bind(this, recent)}
        >
          <div
            className={styles['connect-sidebar-list-item-details']}
          >
            <div
              className={styles['connect-sidebar-list-item-last-used']}
            >
              {this.formatLastUsed(recent)}
            </div>
            <div
              className={styles['connect-sidebar-list-item-name']}
            >
              {title}
            </div>
          </div>
          <DropdownButton
            bsSize="xsmall"
            bsStyle="link"
            title="&hellip;"
            className={styles['connect-sidebar-list-item-actions']}
            noCaret
            pullRight
            id="recent-actions"
          >
            <MenuItem
              eventKey="1"
              onClick={this.onSaveAsFavoriteClicked.bind(this, recent)}
            >
              Add to favorites
            </MenuItem>
            <MenuItem
              eventKey="2"
              onClick={this.onRemoveConnectionClicked.bind(this, recent)}
            >
              Remove
            </MenuItem>
          </DropdownButton>
        </li>
      );
    });
  }

  render() {
    const recents = Object.keys(this.props.connections)
      .map(key => this.props.connections[key])
      .filter(connection => !connection.isFavorite)
      .sort((a, b) => {
        // The `lastUsed` value hasn't always existed, so we assign
        // them a date in 2016 for sorting if it isn't there.
        const aLastUsed = a.lastUsed ? a.lastUsed : 1463658247465;
        const bLastUsed = b.lastUsed ? b.lastUsed : 1463658247465;
        return bLastUsed - aLastUsed;
      });

    const clearAllDiv =
      recents.length > 0 ? (
        <div
          onClick={this.onClearConnectionsClicked}
          className={styles['connect-sidebar-header-recent-clear']}
        >
          Clear all
        </div>
      ) : (
        ''
      );

    return (
      <div className="connect-sidebar-connections-recents">
        <div className={styles['connect-sidebar-header']}>
          <div className={styles['connect-sidebar-header-recent']}>
            <div>
              <i className="fa fa-fw fa-history" />
              <span>Recents</span>
            </div>
            {clearAllDiv}
          </div>
        </div>
        <ul className={styles['connect-sidebar-list']}>
          {this.renderRecents(recents)}
        </ul>
      </div>
    );
  }
}

export default Recents;
