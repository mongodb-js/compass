import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import Icon from '@leafygreen-ui/icon';

import Actions from '../../actions';

import styles from './sidebar.less';

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Favorites extends React.Component {
  static displayName = 'Favorites';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    connections: PropTypes.object.isRequired
  };

  /**
   * Selects a favorite connection.
   *
   * @param {Object} favorite - A favorite connection.
   */
  onFavoriteClicked(favorite) {
    Actions.onConnectionSelected(favorite);
  }

  /**
   * Selects and connects to a favorite connection.
   *
   * @param {Object} favorite - A favorite connection.
   */
  onFavoriteDoubleClicked(favorite) {
    Actions.onConnectionSelectAndConnect(favorite);
  }

  /**
   * Copies a favorite connection.
   *
   * @param {Object} favorite - A favorite connection.
   * @param {Object} evt - evt.
   */
  onDuplicateConnectionClicked(favorite, evt) {
    evt.stopPropagation();
    Actions.onDuplicateConnectionClicked(favorite);
  }

  /**
   * Deletes a favorite connection.
   *
   * @param {Object} favorite - A favorite connection.
   * @param {Object} evt - evt.
   */
  onRemoveConnectionClicked(favorite, evt) {
    evt.stopPropagation();
    Actions.onDeleteConnectionClicked(favorite);
  }

  /**
   * Opens a modal for editing a favorite connection.
   */
  onEditConnectionClicked() {
    Actions.showFavoriteModal();
  }

  /**
   * Copies a favorite connection.
   *
   * @param {Object} evt - evt.
   */
  onContextualMenuClicked(evt) {
    evt.stopPropagation();
  }

  /**
   * Gets a proper class name for active and not active favorite connections.
   *
   * @param {Object} favorite - A favorite connection.
   *
   * @returns {String} - A class name
   */
  getClassName(favorite) {
    const classnamesProps = [styles['connect-sidebar-list-item']];

    if (this.props.connectionModel._id === favorite._id) {
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

    if (new Date() - model.lastUsed < TWO_DAYS) {
      return moment(model.lastUsed).fromNow();
    }

    return moment(model.lastUsed).format('lll');
  }

  /**
   * Render favorite connections.
   *
   * @returns {React.Component}
   */
  renderFavorites() {
    const favorites = Object.keys(this.props.connections)
      .map(key => this.props.connections[key])
      .filter(connection => connection.isFavorite)
      .sort((a, b) => {
        return (`${b.name}`.toLowerCase() < `${a.name}`.toLowerCase()
          ? 1
          : -1
        );
      });

    return map(favorites, (favorite, i) => {
      const title = `${favorite.hostname}:${favorite.port}`;
      const style = favorite.color
        ? { borderRight: `5px solid ${favorite.color}` }
        : { borderRight: '5px solid transparent' };

      return (
        <li
          className={this.getClassName(favorite)}
          style={style}
          key={i}
          title={title}
          onClick={this.onFavoriteClicked.bind(this, favorite)}
          onDoubleClick={this.onFavoriteDoubleClicked.bind(this, favorite)}
        >
          <div
            className={styles['connect-sidebar-list-item-details']}
          >
            <div
              className={styles['connect-sidebar-list-item-last-used']}
            >
              {this.formatLastUsed(favorite)}
            </div>
            <div
              className={styles['connect-sidebar-list-item-name']}
            >
              {favorite.name}
            </div>
          </div>
          <DropdownButton
            bsSize="xsmall"
            bsStyle="link"
            title="&hellip;"
            className={styles['connect-sidebar-list-item-actions']}
            noCaret
            pullRight
            onClick={this.onContextualMenuClicked}
            id="favorite-actions"
          >
            <MenuItem
              eventKey="1"
              onClick={this.onDuplicateConnectionClicked.bind(this, favorite)}
            >
              Duplicate
            </MenuItem>
            <MenuItem
              eventKey="2"
              onClick={this.onRemoveConnectionClicked.bind(this, favorite)}
            >
              Remove
            </MenuItem>
          </DropdownButton>
        </li>
      );
    });
  }

  render() {
    return (
      <div className={styles['connect-sidebar-favorites']}>
        <div className={styles['connect-sidebar-header']}>
          <span className={styles['connect-sidebar-header-icon']}>
            <Icon glyph="Favorite" title={false} fill="currentColor" />
          </span>
          <span className={styles['connect-sidebar-header-label']}>
            Favorites
          </span>
        </div>
        <ul className={styles['connect-sidebar-list']}>
          {this.renderFavorites()}
        </ul>
      </div>
    );
  }
}

export default Favorites;
