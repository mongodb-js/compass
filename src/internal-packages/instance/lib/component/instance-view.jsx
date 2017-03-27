const React = require('react');
const ReactTooltip = require('react-tooltip');
const app = require('hadron-app');

/**
 * Represents the component that renders the Compass view of a mongo instance.
 */
class InstanceView extends React.Component {

  /**
   * The InstanceView component constructor.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = {activeTab: 0};
    this.DatabasesTable = app.appRegistry.getComponent('Instance.DatabasesTable');
    this.PerformanceView = app.appRegistry.getComponent('Performance.PerformanceView');
    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
  }

  componentDidMount() {
    // Re-render the global 'is-not-writable' tooltip in a performant way
    // so we don't reintroduce COMPASS-532 on the banks.json data set.
    ReactTooltip.rebuild();
  }

  onTabClicked(idx) {
    if (this.state.activeTab === idx) {
      return;
    }
    this.setState({activeTab: idx});
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const performanceView = <this.PerformanceView interval={this.props.interval} />;
    const databasesTable = <this.DatabasesTable />;
    return (
      <div className="rtss">
        <this.TabNavBar
          theme="light"
          tabs={['Databases', 'Performance']}
          views={[databasesTable, performanceView]}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="rt-nav"
        />
      </div>
    );
  }
}

InstanceView.propTypes = {
  interval: React.PropTypes.number.isRequired
};


InstanceView.displayName = 'InstanceView';

module.exports = InstanceView;
