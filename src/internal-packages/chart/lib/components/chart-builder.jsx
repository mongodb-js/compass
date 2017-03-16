/* eslint new-cap: 0 */
const React = require('react');
const app = require('hadron-app');
const HTML5Backend = require('react-dnd-html5-backend');
const {DragDropContext} = require('react-dnd');
const FieldPanel = require('./field-panel');
const ChartPanel = require('./chart-panel');
const Chart = require('./chart');

const QUERYBAR_LAYOUT = ['filter', 'project', ['sort', 'skip', 'limit']];
const EXPERIMENTAL_WARNING = 'The charts feature is experimental. Use at own risk.';

// const debug = require('debug')('mongodb-compass:chart:chart-builder');

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

  renderChart() {
    if (!this.props.specValid) {
      return null;
    }
    const data = {values: this.props.dataCache};
    return (
      <Chart
        specType={this.props.specType}
        spec={this.props.spec}
        data={data}
        width={600}
        height={400}
        className="chart-builder-chart"
        renderer="canvas"
      />
    );
  }

  /**
   * renders the <ChartBuilder /> component.
   *
   * @return {React.Component}  the rendered content.
   */
  render() {
    const chart = this.renderChart();

    return (
      <div className="chart-builder chart-container">
        <div className="controls-container">
          <this.queryBar layout={QUERYBAR_LAYOUT} />
          {this.renderWarning()}
        </div>
        <div className="chart-builder-container">
          <div className="chart-builder-field-panel">
            <FieldPanel
              fieldsCache={this.props.fieldsCache}
              rootFields={this.props.rootFields}
              actions={this.props.actions}
            />
          </div>
          <div className="chart-builder-chart-panel">
            <ChartPanel
              chartType={this.props.chartType}
              encodedChannels={this.props.channels}
              actions={this.props.actions}
            />
          </div>
          <div className="chart-builder-chart-area">
            {chart}
          </div>
        </div>
      </div>
    );
  }
}

ChartBuilder.propTypes = {
  dataCache: React.PropTypes.array,
  fieldsCache: React.PropTypes.object,
  rootFields: React.PropTypes.array,
  namespaceCache: React.PropTypes.string,
  queryCache: React.PropTypes.object,
  spec: React.PropTypes.object,
  specType: React.PropTypes.string,
  chartType: React.PropTypes.string,
  specValid: React.PropTypes.bool,
  channels: React.PropTypes.object,
  actions: React.PropTypes.object
};

ChartBuilder.defaultProps = {
};

ChartBuilder.displayName = 'ChartBuilder';

module.exports = DragDropContext(HTML5Backend)(ChartBuilder);
