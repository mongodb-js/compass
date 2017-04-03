/* eslint new-cap: 0 */
const React = require('react');
const app = require('hadron-app');
const HTML5Backend = require('react-dnd-html5-backend');
const { DragDropContext } = require('react-dnd');
const { TextButton } = require('hadron-react-buttons');
const { StatusRow } = require('hadron-react-components');
const FieldPanel = require('./field-panel');
const ChartPanel = require('./chart-panel');
const Chart = require('./chart');

const QUERYBAR_LAYOUT = ['filter', 'project', ['sort', 'skip', 'limit']];

// const debug = require('debug')('mongodb-compass:chart:chart-builder');

class ChartBuilder extends React.Component {

  constructor(props) {
    super(props);

    // fetch external components
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
    this.state = {chartWidth: 600, chartHeight: 400};
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    this.setState({chartWidth: width * 0.4, chartHeight: height * 0.8});
  }

  /**
   * temporary warning to indicate this is an experimental feature and may
   * not work as expected.
   *
   * @return {React.Component} <StatusRow /> banner with warning.
   */
  renderWarning() {
    return (
      <StatusRow>
        <TextButton
          text="Reset Chart"
          className="btn btn-default btn-xs chart-builder-reset-button"
          clickHandler={this.props.actions.clearChart}
        />
      </StatusRow>
    );
  }


  renderChart() {
    if (!this.props.specValid) {
      return null;
    }

    return (
      <Chart
        specType={this.props.specType}
        spec={this.props.spec}
        data={this.props.dataCache}
        width={this.state.chartWidth}
        height={this.state.chartHeight}
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
