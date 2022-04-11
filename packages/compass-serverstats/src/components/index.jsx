require('./index.less');

const React = require('react');
const { WorkspaceContainer, css, spacing } = require('@mongodb-js/compass-components');
const { StatusRow } = require('hadron-react-components');

const GraphsComponent = require('./server-stats-graphs-component');
const { realTimeDispatcher } = require('../d3');
const ListsComponent = require('./server-stats-lists-component');
const DBErrorComponent = require('./dberror-component');
const DBErrorStore = require('../stores/dberror-store');
const ServerStatsStore = require('../stores/server-stats-graphs-store');
const { ServerStatsToolbar } = require('./server-stats-toolbar');

/**
 * The default interval.
 */
const INTERVAL = 1000;

const workspaceBackground = '#3D4247';

const workspaceContainerStyles = css({
  background: workspaceBackground
});

const workspaceStyles = css({
  padding: spacing[4],
  marginBottom: spacing[6],
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
  flexGrow: 1
});

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
        <ServerStatsToolbar eventDispatcher={this.eventDispatcher} />
        {ServerStatsStore.isMongos ? this.renderTopMessage() : null}
        <DBErrorComponent store={DBErrorStore} />
        <WorkspaceContainer darkMode className={workspaceContainerStyles}>
          <div className={workspaceStyles}>
            <section className="rt__graphs-out">
              <GraphsComponent eventDispatcher={this.eventDispatcher} interval={INTERVAL} />
            </section>
            <section className="rt__lists-out">
              <ListsComponent interval={INTERVAL} />
            </section>
          </div>
        </WorkspaceContainer>
      </section>
    );
  }
}

module.exports = PerformanceComponent;
