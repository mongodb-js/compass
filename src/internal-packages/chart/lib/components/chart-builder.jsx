const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const ChartActions = require('../actions');
const HTML5Backend = require('react-dnd-html5-backend');
const { DragDropContext } = require('react-dnd');
const ReactTooltip = require('react-tooltip');
const { TextButton } = require('hadron-react-buttons');
const { StatusRow } = require('hadron-react-components');
const FieldPanel = require('./field-panel');
const ChartPanel = require('./chart-panel');
const Chart = require('./chart');
const { TOOL_TIP_ID_ARRAY } = require('../constants');

const QUERYBAR_LAYOUT = ['filter', 'project', ['sort', 'skip', 'limit']];

// const debug = require('debug')('mongodb-compass:chart:chart-builder');

class ChartBuilder extends React.Component {

  constructor(props) {
    super(props);

    // fetch external components
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');

    // intialise chart dimensions
    this.state = {width: 0, height: 0};
  }

  componentDidMount() {
    this.handleResize();
    this.boundHandleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundHandleResize);
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  componentWillUnmount() {
    ChartActions.clearChart();
    window.removeEventListener('resize', this.boundHandleResize);
  }


  _getChartDimensions() {
    const areaDim = document.getElementsByClassName('chart-builder-chart-area')[0];
    const width = areaDim.offsetWidth - 200;
    const height = areaDim.offsetHeight - 130;
    return {width, height};
  }

  handleResize() {
    if (this.CollectionStore.getActiveTab() !== 5) {
      return;
    }

    const dim = this._getChartDimensions();
    this.setState({width: dim.width, height: dim.height});
  }

  /**
   * temporary warning to indicate this is an experimental feature and may
   * not work as expected.
   *
   * @return {React.Component} <StatusRow /> banner with warning.
   */
  renderWarning() {
    // use plain buttons until IconTextButton passes all props, e.g. `disabled`
    return (
      <StatusRow>
        <span className="chart-builder-query-message">We should put sampling and document results message back here</span>
        <TextButton
          text="Reset Chart"
          className="btn btn-default btn-xs chart-builder-reset-button"
          clickHandler={this.props.actions.clearChart}
        />
        <button
          type="button"
          className="btn btn-default btn-xs chart-builder-undo-button"
          disabled={!this.props.hasUndoableActions}
          onClick={this.props.actions.undoAction}
        >
          <i className="fa fa-fw fa-undo" aria-hidden /> Undo
        </button>
        <button
          type="button"
          className="btn btn-default btn-xs chart-builder-redo-button"
          disabled={!this.props.hasRedoableActions}
          onClick={this.props.actions.redoAction}
        >
          <i className="fa fa-fw fa-repeat" aria-hidden /> Redo
        </button>
      </StatusRow>
    );
  }


  renderChart() {
    if (!this.props.specValid) {
      return null;
    }

    // use _getChartDimensions() on the first render but use state thereafter on resize changes
    const dim = (!this.state.width || !this.state.height) ?
      this._getChartDimensions() : {width: this.state.width, height: this.state.height};

    return (
      <Chart
        specType={this.props.specType}
        spec={this.props.spec}
        data={this.props.dataCache}
        width={dim.width}
        height={dim.height}
        className="chart-builder-chart"
        renderer="svg"
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
          <div className="chart-builder-field-panel-container">
            <FieldPanel
              fieldsCache={this.props.fieldsCache}
              topLevelFields={this.props.topLevelFields}
              actions={this.props.actions}
            />
          </div>
          <div className="chart-builder-chart-panel-container">
            <div className="chart-builder-chart-panel">
              <ChartPanel
                chartType={this.props.chartType}
                encodedChannels={this.props.channels}
                actions={this.props.actions}
              />
            </div>
          </div>
          <div className="chart-builder-chart-area">
            {chart}
          </div>
        </div>
        <ReactTooltip id={TOOL_TIP_ID_ARRAY} place="right" effect="solid" delayShow={200}/>
      </div>
    );
  }
}

ChartBuilder.propTypes = {
  dataCache: PropTypes.array,
  fieldsCache: PropTypes.object,
  topLevelFields: PropTypes.array,
  namespaceCache: PropTypes.string,
  queryCache: PropTypes.object,
  spec: PropTypes.object,
  specType: PropTypes.string,
  chartType: PropTypes.string,
  specValid: PropTypes.bool,
  channels: PropTypes.object,
  actions: PropTypes.object,
  hasUndoableActions: PropTypes.bool,
  hasRedoableActions: PropTypes.bool
};

ChartBuilder.defaultProps = {
};

ChartBuilder.displayName = 'ChartBuilder';

module.exports = DragDropContext(HTML5Backend)(ChartBuilder);  // eslint-disable-line new-cap
