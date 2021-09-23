require('./index.less');

const React = require('react');

const GraphsComponent = require('./server-stats-graphs-component');
const { realTimeDispatcher } = require('../d3');
const ListsComponent = require('./server-stats-lists-component');
const DBErrorComponent = require('./dberror-component');
const TimeAndPauseButton = require('./time-and-pause-button');
const DBErrorStore = require('../stores/dberror-store');
const ServerStatsStore = require('../stores/server-stats-graphs-store');
const { StatusRow } = require('hadron-react-components');

/**
 * The default interval.
 */
const INTERVAL = 1000;

/**
 * Renders the entire performance tab, including charts and lists.
 */
class PerformanceComponent extends React.Component {
  constructor(props) {
    super(props);
    this.eventDispatcher = realTimeDispatcher();
  }

  renderTopMessage() {
    return (
      <StatusRow style="warning">
        Top command is not available for mongos, some charts may not show any data.
      </StatusRow>
    );
  }

  /**
   * Render the performance component.
   *
   * @returns {React.Component}
   */
  render() {
    return (
      <section className="rt-perf">
        <div className="controls-container">
          <TimeAndPauseButton paused={false} eventDispatcher={this.eventDispatcher} />
          {ServerStatsStore.isMongos ? this.renderTopMessage() : null}
          <DBErrorComponent store={DBErrorStore} />
        </div>
        <div className="column-container">
          <div className="column main">
            <section className="rt__graphs-out">
              <GraphsComponent eventDispatcher={this.eventDispatcher} interval={INTERVAL} />
            </section>
            <section className="rt__lists-out">
              <ListsComponent interval={INTERVAL} />
            </section>
          </div>
        </div>
      </section>
    );
  }
}

module.exports = PerformanceComponent;
