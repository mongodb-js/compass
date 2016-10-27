const timer = require('d3-timer');
const React = require('react');
const Actions = require('../actions');
const ChartComponent = require('./chart-component');
const OpCountersStore = require('../stores/opcounters-store');
const NetworkStore = require('../stores/network-store');
const GlobalLockStore = require('../stores/globallock-store');
const MemStore = require('../stores/mem-store');
// const debug = require('debug')('mongodb-compass:server-stats-graphs-component');

/**
 * Represents the component that renders all the server stats.
 */
class ServerStatsComponent extends React.Component {

  /**
   * The server stats component constructor.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * When the component mounts, start the polling timer.
   */
  componentDidMount() {
    this.timer = timer.interval(() => {
      Actions.pollServerStats();
    }, this.props.interval);
  }

  /**
   * When the component unmounts, we stop the timer.
   */
  componentWillUnmount() {
    this.timer.stop();
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="server-stats">
        <div className="opcounters">
          <ChartComponent store={OpCountersStore} />
        </div>
        <div className="globallock">
          <ChartComponent store={GlobalLockStore} />
        </div>
        <div className="network">
          <ChartComponent store={NetworkStore} />
        </div>
        <div className="mem">
          <ChartComponent store={MemStore} />
        </div>
      </div>
    );
  }
}

ServerStatsComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};


ServerStatsComponent.displayName = 'ServerStatsComponent';

module.exports = ServerStatsComponent;
