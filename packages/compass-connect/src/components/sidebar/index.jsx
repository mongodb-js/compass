const React = require('react');
const PropTypes = require('prop-types');
const NewConnection = require('./new-connection');
const Favorites = require('./favorites');
const Recents = require('./recents');
const AtlasLink = require('../atlas-link');

class Sidebar extends React.Component {

  render() {
    return (
      <div>
        <div className="connect-sidebar">
          <AtlasLink />
          <NewConnection {...this.props} />
          <div className="connect-sidebar-connections">
            <Favorites {...this.props} />
            <Recents {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  connections: PropTypes.object.isRequired
};

Sidebar.displayName = 'Sidebar';

module.exports = Sidebar;
