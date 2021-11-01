const React = require('react');
const filter = require('lodash.filter');
const PropTypes = require('prop-types');
const { TabNavBar, UnsafeComponent } = require('hadron-react-components');
const { track } = require('@mongodb-js/compass-logging').createLoggerAndTelemetry('COMPASS-INSTANCE-UI');

function trackingIdForTabName(name) {
  return name.toLowerCase().replace(/ /g, '_');
}

/**
 * Represents the instance view.
 */
class InstanceComponent extends React.Component {
  static displayName = 'InstanceComponent';
  static propTypes = {
    isDataLake: PropTypes.bool.isRequired
  };


  /**
   * Instantiate the instance component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };
  }

  /**
   * Handle the tab click.
   *
   * @param {Number} idx - The index of the clicked tab.
   */
  onTabClicked(idx, name) {
    if (this.state.activeTab === idx) {
      return;
    }
    global.hadronApp.appRegistry.emit('compass:screen:viewed', { screen: name });
    track('Screen', { name: trackingIdForTabName(name) });
    this.setState({ activeTab: idx });
  }

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const instanceTabs = global.hadronApp.appRegistry.getRole('Instance.Tab');
    const roles = filter(instanceTabs, (role) => {
      return !(this.props.isDataLake && role.name === 'Performance');
    });

    const tabs = roles.map((role) => role.name);
    const views = roles.map((role, i) => {
      return (
        <UnsafeComponent component={role.component} key={i} />
      );
    });

    this.tabs = tabs;
    this.views = views;
    if (tabs.length > 0) {
      track('Screen', { name: trackingIdForTabName(tabs[0]) });
    }
  }

  /**
   * Render the instance component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    this.setupTabs();
    return (
      <div className="rtss">
        <TabNavBar
          data-test-id="instance-tabs"
          aria-label="Instance Tabs"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          mountAllViews={false} />
      </div>
    );
  }
}

module.exports = InstanceComponent;
