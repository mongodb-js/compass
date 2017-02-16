const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-performance-component');

const GraphsComponent = require('./server-stats-graphs-component');
const ListsComponent = require('./server-stats-lists-component');
const DBErrorComponent = require('./dberror-component');
const TimeAndPauseButton = require('./time-and-pause-button');
const DBErrorStore = require('../store/dberror-store');
const ServerStatsStore = require('../store/server-stats-graphs-store');
const app = require('hadron-app');

class PerformanceComponent extends React.Component {

  constructor(props) {
    super(props);
    this.StatusRow = app.appRegistry.getComponent('App.StatusRow');
  }

  renderTopMessage() {
    return (
      <this.StatusRow style="warning">
        Top command is not available for mongos, some charts may not show any data.
      </this.StatusRow>
    );
  }

  render() {
    return (
      <section className="rt-perf">
        <div className="controls-container">
          <TimeAndPauseButton paused={false} />
          {ServerStatsStore.isMongos ? this.renderTopMessage() : null}
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
