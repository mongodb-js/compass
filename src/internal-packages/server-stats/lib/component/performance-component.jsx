const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-performance-component');

const ServerStatsComponent = require('./server-stats-graphs-component');
const CurrentOpComponent = require('./current-op-component');
const TopComponent = require('./top-component');
const CurrentOpStore = require('../store/current-op-store');
const TopStore = require('../store/top-store');

class PerformanceComponent extends React.Component {
  render() {
    return (
      <section className="rt-perf">
        <section className="rt__graphs-out">
          <ServerStatsComponent interval={this.props.interval} />
        </section>
        <section className="rt__lists-out">
          <TopComponent interval={this.props.interval} store={TopStore} />
          <CurrentOpComponent interval={this.props.interval} store={CurrentOpStore}/>
        </section>
      </section>
    );
  }
}

PerformanceComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = PerformanceComponent;
