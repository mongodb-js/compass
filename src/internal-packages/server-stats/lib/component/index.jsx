'use strict';

const React = require('react');
const Actions = require('../action');
const OpCountersComponent = require('./opcounters-component');
const NetworkComponent = require('./network-component');
const OpCountersStore = require('../store/opcounters-store');
const NetworkStore = require('../store/network-store');

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
    this.intervalId = setInterval(() => {
      Actions.pollServerStats();
    }, this.props.interval);
  }

  /**
   * When the component unmounts, we stop the timer.
   */
  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className='server-stats'>
        <div className='opcounters'>
          <OpCountersComponent store={OpCountersStore} />
        </div>
        <div className='network'>
          <NetworkComponent store={NetworkStore} />
        </div>
        <div className='read-write'>
        </div>
        <div className='memory'>
        </div>
      </div>
    );
  }
}

ServerStatsComponent.displayName = 'ServerStatsComponent';

module.exports = ServerStatsComponent;
