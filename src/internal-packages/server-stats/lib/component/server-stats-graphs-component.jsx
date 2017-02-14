const timer = require('d3-timer');
const React = require('react');
const Actions = require('../action');
const ChartComponent = require('./chart-component');
const OpCountersStore = require('../store/opcounters-store');
const NetworkStore = require('../store/network-store');
const GlobalLockStore = require('../store/globallock-store');
const MemStore = require('../store/mem-store');
const { DataServiceActions } = require('mongodb-data-service');

/**
 * Represents the component that renders all the server stats.
 */
class ServerStatsComponent extends React.Component {

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
      <div className="server-stats">
        <div className="opcounters">
          <ChartComponent chartname="OpCounter" store={OpCountersStore} />
        </div>
        <div className="globallock">
          <ChartComponent chartname="GlobalLock" store={GlobalLockStore} />
        </div>
        <div className="network">
          <ChartComponent chartname="Network" store={NetworkStore} />
        </div>
        <div className="mem">
          <ChartComponent chartname="Mem" store={MemStore} />
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
