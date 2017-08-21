const React = require('react');
const NewConnectionSection = require('./new-connection-section');

class Sidebar extends React.Component {

  render() {
    return (
      <div>
        <div className="sidebar panel">
          <NewConnectionSection />
        </div>
      </div>
    );
  }
}

Sidebar.displayName = 'Sidebar';

module.exports = Sidebar;
