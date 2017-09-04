const React = require('react');
const PropTypes = require('prop-types');
const map = require('lodash.map');
const moment = require('moment');
const Actions = require('../../actions');

const TWO_DAYS = 24 * 60 * 60 * 1000;

class Recents extends React.Component {

  onRecentClicked(recent) {
    Actions.onConnectionSelected(recent);
  }

  getClassName(recent) {
    let className = 'connect-sidebar-list-item';
    if (this.props.currentConnection === recent) {
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

  renderRecents() {
    const recents = this.props.connections.filter((connection) => {
      return !connection.is_favorite;
    });
    return map(recents, (recent, i) => {
      const title = `${recent.hostname}:${recent.port}`;
      return (
        <li
          className={this.getClassName(recent)}
          key={i}
          title={title}
          onClick={this.onRecentClicked.bind(this, recent)}>
          <div className="connect-sidebar-list-item-last-used">{this.formatLastUsed(recent)}</div>
          <div className="connect-sidebar-list-item-name">{title}</div>
        </li>
      );
    });
  }

  render() {
    return (
      <div className="connect-sidebar-connections-recents">
        <div className="connect-sidebar-header">
          <i className="fa fa-fw fa-history" />
          <span>Recents</span>
        </div>
        <ul className="connect-sidebar-list">
          {this.renderRecents()}
        </ul>
      </div>
    );
  }
}

Recents.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  connections: PropTypes.object.isRequired
};

Recents.displayName = 'Recents';

module.exports = Recents;
