const React = require('react');
const PropTypes = require('prop-types');
const map = require('lodash.map');
const moment = require('moment');
const Actions = require('../../actions');

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Favorites extends React.Component {

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

  formatLastUsed(model) {
    if (!model.last_used) return 'Never';
    if ((new Date() - model.last_used) < TWO_DAYS) {
      return moment(model.last_used).fromNow();
    }
    return moment(model.last_used).format('lll');
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
          <div>
            <div className="connect-sidebar-list-item-last-used">{this.formatLastUsed(favorite)}</div>
            <div className="connect-sidebar-list-item-name">{favorite.name}</div>
          </div>
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

Favorites.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  connections: PropTypes.object.isRequired
};

Favorites.displayName = 'Favorites';

module.exports = Favorites;
