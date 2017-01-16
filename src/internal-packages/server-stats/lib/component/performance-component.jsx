const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-performance-component');

const GraphsComponent = require('./server-stats-graphs-component');
const ListsComponent = require('./server-stats-lists-component');
const DBErrorComponent = require('./dberror-component');
const TimeAndPauseButton = require('./time-and-pause-button');
const DBErrorStore = require('../store/dberror-store');

class PerformanceComponent extends React.Component {
  render() {
    return (
      <section className="rt-perf">
        <div className="controls-container">
          <TimeAndPauseButton paused={false} />
          <DBErrorComponent store={DBErrorStore} />
        </div>
        <div className="column-container">
          <div className="column main">
            <section className="rt__graphs-out">
              <GraphsComponent interval={this.props.interval} />
            </section>
            <section className="rt__lists-out">
              <ListsComponent interval={this.props.interval} />
            </section>
          </div>
        </div>
      </section>
    );
  }
}

PerformanceComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = PerformanceComponent;
