const React = require('react');
const PropTypes = require('prop-types');
const map = require('lodash.map');
const Actions = require('../actions');

class FavoriteListSection extends React.Component {

  onFavoriteClicked(favorite) {
    Actions.onConnectionSelected(favorite);
  }

  getClassName(favorite) {
    let className = 'connect-sidebar-list-item';
    if (this.props.currentConnection === favorite) {
      className += ' connect-sidebar-list-item-is-active';
    }
    return className;
  }

  renderFavorites() {
    const favorites = this.props.connections.filter((connection) => {
      return connection.is_favorite;
    });
    return map(favorites, (favorite, i) => {
      const title = `${favorite.hostname}:${favorite.port}`;
      return (
        <li
          className={this.getClassName(favorite)}
          key={i}
          title={title}
          onClick={this.onFavoriteClicked.bind(this, favorite)}>
          <div className="connect-sidebar-list-item-last-used">{favorite.last_used || 'Never'}</div>
          <div className="connect-sidebar-list-item-name">{favorite.name}</div>
        </li>
      );
    });
  }

  render() {
    return (
      <div className="connect-sidebar-connections-favorites">
        <div className="connect-sidebar-header">
          <i className="fa fa-fw fa-star" />
          <span>Favorites</span>
        </div>
        <ul className="connect-sidebar-list">
          {this.renderFavorites()}
        </ul>
      </div>
    );
  }
}

FavoriteListSection.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  connections: PropTypes.object.isRequired
};

FavoriteListSection.displayName = 'FavoriteListSection';

module.exports = FavoriteListSection;
