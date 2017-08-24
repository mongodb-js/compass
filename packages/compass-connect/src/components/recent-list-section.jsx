const React = require('react');
const PropTypes = require('prop-types');
const map = require('lodash.map');
const Actions = require('../actions');

class RecentListSection extends React.Component {

  onRecentClicked(recent) {
    Actions.onRecentSelected(recent);
  }

  getClassName(recent) {
    let className = 'connect-sidebar-list-item';
    if (this.props.currentConnection === recent) {
      className += ' connect-sidebar-list-item-is-active';
    }
    return className;
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
          <div className="connect-sidebar-list-item-last-used">{recent.last_used || 'Never'}</div>
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

RecentListSection.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  connections: PropTypes.object.isRequired
};

RecentListSection.displayName = 'RecentListSection';

module.exports = RecentListSection;
