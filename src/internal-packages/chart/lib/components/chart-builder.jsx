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
const {
  TOOL_TIP_ID_ARRAY,
  VIEW_TYPE_ENUM,
  SPEC_TYPE_ENUM
} = require('../constants');

const QUERYBAR_LAYOUT = ['filter', ['sort', 'skip', 'limit', 'sample']];

// const debug = require('debug')('mongodb-compass:chart:chart-builder');

/**
 * The minimum spacing needed to avoid a horizontal scrollbar, in pixels.
 * Happens with cases like long company name labels.
 */
const WIDTH_MIN_SPACING = 210;

/**
 * The minimum spacing needed to avoid a vertical scrollbar, in pixels.
 * Happens with cases like long company name labels.
 */
const HEIGHT_MIN_SPACING = 210;

/**
 * The smallest chart width in pixels, to avoid negative size errors.
 */
const MIN_CHART_WIDTH = 50;

/**
 * The smallest chart height in pixels, to avoid negative size errors.
 */
const MIN_CHART_HEIGHT = 50;


class ChartBuilder extends React.Component {

  constructor(props) {
    super(props);

    // fetch external components
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.ViewSwitcher = app.appRegistry.getComponent('App.ViewSwitcher');

    // intialise chart dimensions
    this.state = {
      width: 0,
      height: 0,
      editorSpec: JSON.stringify(props.spec, null, '  '),
      reRenderChart: true
    };
  }

  componentDidMount() {
    this.handleResize();
    this.boundHandleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundHandleResize);
  }

  componentWillReceiveProps(nextProps) {
    const viewSwitched = nextProps.viewType !== this.props.viewType;

    this.setState({
      editorSpec: JSON.stringify(nextProps.spec, null, '  '),
      reRenderChart: !viewSwitched
    });
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  componentWillUnmount() {
    ChartActions.clearChart();
    window.removeEventListener('resize', this.boundHandleResize);
  }

  onViewSwitch(label) {
    if (label === VIEW_TYPE_ENUM.CHART_BUILDER) {
      this.props.actions.switchToChartBuilderView();
    } else if (label === VIEW_TYPE_ENUM.JSON_EDITOR) {
      this.props.actions.switchToJSONView();
    }
  }

  onJSONEditorChange(evt) {
    this.setState({
      editorSpec: evt.target.value
    });
  }

  onJSONEditorFocus() {
    this.setState({reRenderChart: false});
  }

  onJSONEditorBlur() {
    this.props.actions.setSpecAsJSON(this.state.editorSpec);
    this.setState({reRenderChart: true});
  }

  handleResize() {
    if (this.CollectionStore.getActiveTab() !== 5) {
      return;
    }

    const dim = this._getChartDimensions();
    this.setState({width: dim.width, height: dim.height});
  }

  _getChartDimensions() {
    const areaDim = document.getElementsByClassName('chart-builder-chart-area')[0];
    const width = Math.max(MIN_CHART_WIDTH, areaDim.offsetWidth - WIDTH_MIN_SPACING);
    const height = Math.max(MIN_CHART_HEIGHT, areaDim.offsetHeight - HEIGHT_MIN_SPACING);
    return {width, height};
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
        <this.ViewSwitcher
          label="Edit Mode"
          buttonLabels={[VIEW_TYPE_ENUM.CHART_BUILDER, VIEW_TYPE_ENUM.JSON_EDITOR]}
          activeButton={this.props.viewType}
          dataTestId="chart-view-switcher"
          disabled={this.props.specType === SPEC_TYPE_ENUM.VEGA}
          onClick={this.onViewSwitch.bind(this)}
        />
        <span>
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
          <TextButton
            text="Reset Chart"
            className="btn btn-default btn-xs chart-builder-reset-button"
            clickHandler={this.props.actions.clearChart}
          />
        </span>
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
        reRenderChart={this.state.reRenderChart}
        className="chart-builder-chart"
        renderer="svg"
      />
    );
  }

  /**
   * renders either the chart builder or the JSON editor, depending on
   * the viewType prop.
   *
   * @return {View}   the correct chart editor view
   */
  renderChartEditor() {
    let chartAreaClass = 'chart-builder-chart-area';
    if (!this.props.specValid) {
      chartAreaClass += ' chart-builder-chart-area-has-zero-state';
    }
    // if in chart builder mode, render field and chart panel
    if (this.props.viewType === VIEW_TYPE_ENUM.CHART_BUILDER) {
      return (
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
                specType={this.props.specType}
                chartType={this.props.chartType}
                availableChartRoles={this.props.availableChartRoles}
                encodedChannels={this.props.channels}
                reductions={this.props.reductions}
                actions={this.props.actions}
              />
            </div>
          </div>
          <div className={chartAreaClass}>
            {this.renderChart()}
          </div>
        </div>
      );
    }
    // otherwise render the JSON editor
    return (
      <div className="chart-builder-container">
        <div className="chart-builder-json-editor-container">
          <textarea className="chart-builder-json-textarea"
            value={this.state.editorSpec}
            onChange={this.onJSONEditorChange.bind(this)}
            onBlur={this.onJSONEditorBlur.bind(this)}
            onFocus={this.onJSONEditorFocus.bind(this)} />
        </div>
        <div className={chartAreaClass}>
          {this.renderChart()}
        </div>
      </div>
    );
  }

  /**
   * renders the <ChartBuilder /> component.
   *
   * @return {React.Component}  the rendered content.
   */
  render() {
    return (
      <div className="chart-builder chart-container">
        <div className="controls-container">
          <this.queryBar layout={QUERYBAR_LAYOUT} />
          {this.renderWarning()}
        </div>
        {this.renderChartEditor()}
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
  viewType: PropTypes.string,
  availableChartRoles: PropTypes.array,
  specValid: PropTypes.bool,
  channels: PropTypes.object,
  reductions: PropTypes.object,
  actions: PropTypes.object,
  hasUndoableActions: PropTypes.bool,
  hasRedoableActions: PropTypes.bool
};

ChartBuilder.displayName = 'ChartBuilder';

module.exports = DragDropContext(HTML5Backend)(ChartBuilder);  // eslint-disable-line new-cap
