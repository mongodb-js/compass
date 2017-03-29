const React = require('react');
const { TabNavBar } = require('hadron-react-components');
const Actions = require('../actions');
const Performance = require('./performance-component');
const app = require('hadron-app');

// const debug = require('debug')('mongodb-compass:server-stats:RTSSComponent');

/**
 * Represents the component that renders all the server stats.
 */
class RTSSComponent extends React.Component {

  /**
   * The RTSS view component constructor.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = {activeTab: 0};
    this.DatabasesView = app.appRegistry.getComponent('DatabaseDDL.DatabasesView');
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
    const databasesView = <this.DatabasesView />;
    return (
      <div className="rtss">
        <TabNavBar
          theme="light"
          tabs={['Databases', 'Performance']}
          views={[databasesView, performanceView]}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="rt-nav"
        />
      </div>
    );
  }
}

RTSSComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};


RTSSComponent.displayName = 'RTSSComponent';

module.exports = RTSSComponent;
