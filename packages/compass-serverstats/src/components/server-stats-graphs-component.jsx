const timer = require('d3-timer');
const React = require('react');
const PropTypes = require('prop-types');
const ChartComponent = require('./chart-component');
const OpCountersStore = require('../stores/opcounters-store');
const NetworkStore = require('../stores/network-store');
const GlobalLockStore = require('../stores/globallock-store');
const MemStore = require('../stores/mem-store');
const Actions = require('../actions');
const d3 = require('d3');

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
    this.eventDispatcher = d3.dispatch('mouseover', 'updatelabels', 'updateoverlay', 'mouseout');
  }

  /**
   * When the component mounts, start the polling timer.
   */
  componentDidMount() {
    this.timer = timer.interval(() => {
      Actions.serverStats();
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
      <div className="serverstats">
        <ChartComponent width={520} height={145} store={OpCountersStore} dispatcher={this.eventDispatcher} />
        <ChartComponent width={520} height={145} store={GlobalLockStore} dispatcher={this.eventDispatcher} />
        <ChartComponent width={520} height={145} store={NetworkStore} dispatcher={this.eventDispatcher} />
        <ChartComponent width={520} height={145} store={MemStore} dispatcher={this.eventDispatcher} />
      </div>
    );
  }
}

ServerStatsComponent.propTypes = {
  interval: PropTypes.number.isRequired
};


ServerStatsComponent.displayName = 'ServerStatsComponent';

module.exports = ServerStatsComponent;
