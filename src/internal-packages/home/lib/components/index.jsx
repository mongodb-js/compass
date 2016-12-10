const React = require('react');
const app = require('ampersand-app');

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.sideBarComponent = app.appRegistry.getComponent('Sidebar.Component');
  }

  renderNoCollections() {
    return (
      <div className="no-collections-zero-state">
        <span>
          The MongoDB instance you are connected to does not contain
          any collections.
          <a className="show-connect-window">
            Connect to another instance.
          </a>
        </span>
      </div>
    );
  }

  renderContent() {
    return;
  }

  render() {
    const hasContent = false;
    return (
      <div className="page">
        <div className="content with-sidebar">
          {hasContent ? this.renderContent() : this.renderNoCollections()}
        </div>
        {this.sideBarComponent}
      </div>
    );
  }
}

Home.propTypes = {
};

Home.displayName = 'Home';

module.exports = Home;
