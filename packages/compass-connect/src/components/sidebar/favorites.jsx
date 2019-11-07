import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import moment from 'moment';
import Actions from 'actions';
import classnames from 'classnames';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import styles from './sidebar.less';

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Favorites extends React.Component {
  static displayName = 'Favorites';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
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
   * Copies a favorite connection.
   *
   * @param {Object} favorite - A favorite connection.
   * @param {Object} evt - evt.
   */
  onCopyConnectionClicked(favorite, evt) {
    evt.stopPropagation();
    Actions.onCopyConnectionClicked(favorite);
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

    if (this.props.currentConnection._id === favorite._id) {
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
   * Render favorite connections.
   *
   * @returns {React.Component}
   */
  renderFavorites() {
    const favorites = Object
      .keys(this.props.connections)
      .map((key) => this.props.connections[key])
      .filter((connection) => connection.isFavorite);

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
          onClick={this.onFavoriteClicked.bind(this, favorite)}>
          <div className={classnames(styles['connect-sidebar-list-item-details'])}>
            <div className={classnames(styles['connect-sidebar-list-item-last-used'])}>
              {this.formatLastUsed(favorite)}
            </div>
            <div
              className={classnames(styles['connect-sidebar-list-item-name'])} >
              {favorite.name}
            </div>
          </div>
          <DropdownButton
            bsSize="xsmall"
            bsStyle="link"
            title="&hellip;"
            className={classnames(styles['connect-sidebar-list-item-actions'])}
            noCaret
            pullRight
            onClick={this.onContextualMenuClicked}
            id="favorite-actions">
            <MenuItem eventKey="1" onClick={this.onCopyConnectionClicked.bind(this, favorite)}>Copy</MenuItem>
            <MenuItem eventKey="2" onClick={this.onRemoveConnectionClicked.bind(this, favorite)}>Remove</MenuItem>
          </DropdownButton>
        </li>
      );
    });
  }

  render() {
    return (
      <div className="connect-sidebar-connections-favorites">
        <div className={classnames(styles['connect-sidebar-header'])}>
          <i className="fa fa-fw fa-star" />
          <span>Favorites</span>
        </div>
        <ul className={classnames(styles['connect-sidebar-list'])}>
          {this.renderFavorites()}
        </ul>
      </div>
    );
  }
}

export default Favorites;
