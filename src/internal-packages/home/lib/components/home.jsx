const React = require('react');
const app = require('ampersand-app');

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.sideBar = app.appRegistry.getComponent('Sidebar.Component');
  }

  renderContent() {
    return;
  }

  render() {
    return (
      <div className="page">
        <div className="content with-sidebar">
          {this.renderContent()}
        </div>
        <div className="compass-sidebar-container">
          <this.sideBar />
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  hasContent: React.PropTypes.bool
};

Home.displayName = 'Home';

module.exports = Home;
