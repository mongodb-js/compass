const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const ChartActions = require('../actions');
const HTML5Backend = require('react-dnd-html5-backend');
const { DragDropContext } = require('react-dnd');
const ReactTooltip = require('react-tooltip');
const { TextButton } = require('hadron-react-buttons');
const { StatusRow, ViewSwitcher } = require('hadron-react-components');
const FieldPanel = require('./field-panel');
const ChartPanel = require('./chart-panel');
const Actions = require('../actions');
const _ = require('lodash');

const {
  AXIS_LABEL_MAX_PIXELS,
  AXIS_TITLE_BUFFER_PIXELS,
  MIN_CHART_HEIGHT,
  MIN_CHART_WIDTH,
  SPEC_TYPE_ENUM,
  TOOL_TIP_ARRAY_REDUCE,
  VIEW_TYPE_ENUM,
  REDUCTION_AXIS_TITLE_FACTORIES,
  ARRAY_NUMERIC_REDUCTIONS,
  CHART_CHANNEL_ENUM
} = require('../constants');

const QUERYBAR_LAYOUT = ['filter', ['sort', 'skip', 'limit', 'sample']];

// whitelist axes from CHART_CHANNEL_ENUM (as opposed to chart legends)
const CHART_AXES = [
  CHART_CHANNEL_ENUM.X,
  CHART_CHANNEL_ENUM.Y,
  CHART_CHANNEL_ENUM.X2,
  CHART_CHANNEL_ENUM.Y2
];

// const debug = require('debug')('mongodb-compass:chart:chart-builder');


class ChartBuilder extends React.Component {

  constructor(props) {
    super(props);

    // fetch external components
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.Chart = app.appRegistry.getComponent('Chart.Chart');

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
    this.unsubscribeChartResize = Actions.resizeChart.listen(this.boundHandleResize);
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
    this.unsubscribeChartResize();
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
    const SPACING = AXIS_LABEL_MAX_PIXELS + AXIS_TITLE_BUFFER_PIXELS;
    const width = Math.max(MIN_CHART_WIDTH, areaDim.offsetWidth - SPACING);
    const height = Math.max(MIN_CHART_HEIGHT, areaDim.offsetHeight - SPACING);
    return {width, height};
  }

  /**
   * Generate axis labels based on the types of every element in the provided
   * channel reduction array
   *
   * @param {Object} reductions  the reductions array of a particular channel
   * @return {String}            human readable string representation of reductions
   */
  static _generateReductionAxisLabel(reductions) {
    // generate array of strings based on reduction type
    const strings = reductions.map((reduction) => {
      return REDUCTION_AXIS_TITLE_FACTORIES[reduction.type](reduction.arguments);
    });
    const reductionLabel = strings.join('');

    const lastReduction = _.last(reductions);

    // add 'numeric array' prefix if the final reduction type is for numeric types
    let arrayLabel = _.includes(_.values(ARRAY_NUMERIC_REDUCTIONS), lastReduction.type) ?
      'numeric array ' : 'array ';

    arrayLabel += `'${lastReduction.field}'`;

    return reductionLabel + arrayLabel;
  }

  /**
   * Maps field names to channel names in the encoding section and forces
   * axis and legend labels to use the old field name. This is because the
   * encoding of the data is now done in the aggregation framework directly.
   * Also replaces all aggregate values with "sum" as this acts as an
   * identity function (all aggregations are executed on the server).
   *
   * @param  {Object} spec        the vega-lite spec to render
   * @param  {Object} reductions  the array reductions object
   * @return {Object}             updated spec with field names replaced
   */
  _encodeVegaLiteSpec(spec, reductions) {
    const encodedSpec = _.cloneDeep(spec);
    _.each(encodedSpec.encoding, (encoding, channel) => {
      // overwrite axis and legend titles, wrap in aggregate function if present
      let title = reductions[channel] && _.includes(CHART_AXES, channel) ?
        ChartBuilder._generateReductionAxisLabel(reductions[channel]) : encoding.field;
      if (encoding.aggregate) {
        title = `${encoding.aggregate}(${title})`;
        encoding.aggregate = 'sum';
      }
      encodedSpec.encoding[channel].axis = {
        title: title
      };
      encodedSpec.encoding[channel].legend = {
        title: title
      };
      // rename fields to match channel
      encodedSpec.encoding[channel].field = channel;
    });
    return encodedSpec;
  }

  /**
   * Renders the status row with Undo/Redo buttons, Reset Chart button and
   * Chart Builder / JSON Editor.
   *
   * @return {React.Component} <StatusRow /> banner with buttons.
   */
  renderStatusRow() {
    // use plain buttons until IconTextButton passes all props, e.g. `disabled`
    return (
      <StatusRow>
        <ViewSwitcher
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

    // map field names to channel names for vega-lite
    const spec = (this.props.specType === SPEC_TYPE_ENUM.VEGA_LITE) ?
      this._encodeVegaLiteSpec(this.props.spec, this.props.reductions) : this.props.spec;

    return (
      <this.Chart
        specType={this.props.specType}
        spec={spec}
        data={this.props.dataCache}
        width={dim.width}
        height={dim.height}
        reRenderChart={this.state.reRenderChart}
        className="chart-builder-chart"
        renderer="canvas"
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
          {this.renderStatusRow()}
        </div>
        {this.renderChartEditor()}
        <ReactTooltip
          id={TOOL_TIP_ARRAY_REDUCE['data-for']}
          globalEventOff="click"
          place="left"
          effect="solid" />
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
