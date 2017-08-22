const React = require('react');
const PropTypes = require('prop-types');
const NewConnectionSection = require('./new-connection-section');
const ConnectionsSection = require('./connections-section');

class Sidebar extends React.Component {

  render() {
    return (
      <div>
        <div className="connect-sidebar">
          <NewConnectionSection {...this.props} />
          <ConnectionsSection {...this.props} />
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  connections: PropTypes.object.isRequired
};

Sidebar.displayName = 'Sidebar';

module.exports = Sidebar;
