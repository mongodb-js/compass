const timer = require('d3-timer');
const React = require('react');
const ChartComponent = require('./chart-component');
const OpCountersStore = require('../stores/opcounters-store');
const NetworkStore = require('../stores/network-store');
const GlobalLockStore = require('../stores/globallock-store');
const MemStore = require('../stores/mem-store');
const { DataServiceActions } = require('mongodb-data-service');
const EventDispatcher = require('../d3/real-time-event-dispatch');

// const debug = require('debug')('mongodb-compass:server-stats:graphs-component');

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
    this.eventDispatcher = new EventDispatcher();
  }

  /**
   * When the component mounts, start the polling timer.
   */
  componentDidMount() {
    this.timer = timer.interval(() => {
      DataServiceActions.serverStats();
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
      <div className="rtss">
        <ChartComponent store={OpCountersStore} dispatcher={this.eventDispatcher} />
        <ChartComponent store={GlobalLockStore} dispatcher={this.eventDispatcher} />
        <ChartComponent store={NetworkStore} dispatcher={this.eventDispatcher} />
        <ChartComponent store={MemStore} dispatcher={this.eventDispatcher} />
      </div>
    );
  }
}

ServerStatsComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};


ServerStatsComponent.displayName = 'ServerStatsComponent';

module.exports = ServerStatsComponent;
