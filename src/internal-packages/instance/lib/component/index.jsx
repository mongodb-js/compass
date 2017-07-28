const _ = require('lodash');
const app = require('hadron-app');
const React = require('react');
const { TabNavBar } = require('hadron-react-components');

/**
 * Represents the instance view.
 */
class InstanceComponent extends React.Component {

  /**
   * Instantiate the instance component.
   *
   * @param {Object} props - The properties.
   */
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
    const roles = app.appRegistry.getRole('Instance.Tab');

    const tabs = _.map(roles, 'name');
    const views = _.map(roles, (role) => {
      return React.createElement(role.component);
    });

    this.tabs = tabs;
    this.views = views;
  }

  /**
   * Render the instance component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="rtss">
        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="rt-nav"
          mountAllViews={false}
        />
      </div>
    );
  }
}

InstanceComponent.displayName = 'InstanceComponent';

module.exports = InstanceComponent;
