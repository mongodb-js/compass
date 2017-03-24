const React = require('react');
const Actions = require('../actions');
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


  /**
   * Restart the actions on mount.
   */
  componentDidMount() {
    Actions.restart();
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
