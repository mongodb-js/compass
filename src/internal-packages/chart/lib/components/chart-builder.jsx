const React = require('react');
const app = require('hadron-app');

const QUERYBAR_LAYOUT = ['filter', 'project', ['sort', 'skip', 'limit']];
const EXPERIMENTAL_WARNING = 'The charts feature is experimental. Use at own risk.';

class ChartBuilder extends React.Component {

  constructor(props) {
    super(props);

    // fetch external components
    this.statusRow = app.appRegistry.getComponent('App.StatusRow');
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  /**
   * temporary warning to indicate this is an experimental feature and may
   * not work as expected.
   *
   * @return {React.Component} <StatusRow /> banner with warning.
   */
  renderWarning() {
    return (
      <this.statusRow style="warning">
        {EXPERIMENTAL_WARNING}
      </this.statusRow>
    );
  }

  /**
   * renders the <ChartBuilder /> component.
   *
   * @return {React.Component}  the rendered content.
   */
  render() {
    // @todo (thomas) temporarily output the cached docs as JSON so
    // we have something on the screen to see data fetching works.
    return (
      <div className="charts charts-container">
        <div className="controls-container">
          <this.queryBar layout={QUERYBAR_LAYOUT} />
          {this.renderWarning()}
        </div>
        <pre>
          <code>
            {JSON.stringify(this.props.dataCache, null, 2)}
          </code>
        </pre>
      </div>
    );
  }
}

ChartBuilder.propTypes = {
  dataCache: React.PropTypes.array,
  fieldsCache: React.PropTypes.array,
  namespaceCache: React.PropTypes.string,
  queryCache: React.PropTypes.object,
  spec: React.PropTypes.object,
  specType: React.PropTypes.string,
  chartType: React.PropTypes.string,
  channels: React.PropTypes.object,
  actions: React.PropTypes.object
};

ChartBuilder.defaultProps = {
};

ChartBuilder.displayName = 'ChartBuilder';

module.exports = ChartBuilder;
