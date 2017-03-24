const React = require('react');
const Actions = require('../actions');
const Performance = require('./performance-component');
const app = require('hadron-app');

// const debug = require('debug')('mongodb-compass:server-stats:InstanceView');

/**
 * Represents the component that renders all the server stats.
 */
class InstanceView extends React.Component {

  /**
   * The RTSS view component constructor.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = {activeTab: 0};
    this.DatabasesTable = app.appRegistry.getComponent('DatabaseDDL.DatabasesTable');
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
    const performanceView = <Performance interval={this.props.interval} />;
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
