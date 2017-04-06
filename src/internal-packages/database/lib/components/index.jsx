const React = require('react');
const { TabNavBar } = require('hadron-react-components');
const CollectionsTableView = require('./connected-collections');

class DatabaseView extends React.Component {

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };
    this.setupTabs();
  }

  /**
   * Handle the tab click.
   *
   * @param {Number} idx - The index of the clicked tab.
   */
  onTabClicked(idx) {
    if (this.state.activeTab === idx) {
      return;
    }
    this.setState({ activeTab: idx });
  }

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const roles = app.appRegistry.getRole('Database.Tab');

    const tabs = _.map(roles, 'name');
    const views = _.map(roles, (role) => {
      return React.createElement(role.component);
    });

    this.tabs = tabs;
    this.views = views;
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="collections">
        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={0}
          className="rt-nav" />
      </div>
    );
  }
}

DatabaseView.displayName = 'DatabaseView';

module.exports = DatabaseView;
