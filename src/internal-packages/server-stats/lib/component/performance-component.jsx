const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-performance-component');

const GraphsComponent = require('./server-stats-graphs-component');
const ListsComponent = require('./server-stats-lists-component');
const DBErrorComponent = require('./dberror-component');
const TimeAndPauseButton = require('./time-and-pause-button');
const DBErrorStore = require('../store/dberror-store');
const app = require('ampersand-app');
const StatusRow = app.appRegistry.getComponent('App.StatusRow');

class PerformanceComponent extends React.Component {

  renderTopMessage() {
    return (
        <StatusRow style="warning">
          Top command is not available for mongos, some charts may not show any data.
        </StatusRow>
    );
  }

  render() {
    return (
      <section className="rt-perf">
        <TimeAndPauseButton paused={false} />
        {app.dataService.isMongos() ? this.renderTopMessage() : null}
        <DBErrorComponent store={DBErrorStore} />
        <section className="rt__graphs-out">
          <GraphsComponent interval={this.props.interval} />
        </section>
        <section className="rt__lists-out">
          <ListsComponent interval={this.props.interval} />
        </section>
      </section>
    );
  }
}

PerformanceComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = PerformanceComponent;
