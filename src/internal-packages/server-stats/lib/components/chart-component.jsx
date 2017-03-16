const React = require('react');
const ReactDOM = require('react-dom');
const Actions = require('../actions');
const d3 = require('d3');
const chartFn = require('../d3/').realTimeLineChart;

// const debug = require('debug')('mongodb-compass:server-stats:chart-component');

const LINE_COLORS = ['#45BAAB', '#23B1FF', '#6F72FF', '#A33A35', '#FFA900', '#C7E82F'];

/**
 * Represents the component that renders serverStatus charts.
 */
class ChartComponent extends React.Component {

  /**
   * The server stats component should be initialized with a 'store'
   * property, that triggers with the result of a { serverStatus: 1 }
   * command. Should also have a 'dispatcher' property.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = { error: null, data: {} };
    this.chart = chartFn();
  }

  /**
   * When the component mounts, the component will subscribe to the
   * provided store, so that each time the store triggers the component
   * can update its state. Redraw the component after mounting.
   */
  componentDidMount() {
    this.unsubscribeRefresh = this.props.store.listen(this.refresh.bind(this));
    this.redraw();
  }

  /**
   * Redraw the component on update.
   */
  componentDidUpdate() {
    this.redraw();
  }

  /**
   * When the component unmounts, we unsubscribe from the store and stop the
   * timer.
   */
  componentWillUnmount() {
    this.unsubscribeRefresh();
  }

  /**
   * Refreshes the component state with the new server status data that was
   * received from the store.
   *
   * @param {Error} error - The error, if any occured.
   * @param {Object} data - The javascript object for the result of the command.
   */
  refresh(error, data) {
    this.setState({ error: error, data: data });
  }

  /**
   * Redraw the component.
   */
  redraw() {
    const el = ReactDOM.findDOMNode(this.refs.container);
    const data = this.state.error ? {} : this.state.data;
    const maxTime = data.localTime ? data.localTime[data.localTime.length - 1] : new Date();
    const minTime = data.xLength ? new Date(maxTime.getTime() - (data.xLength * 1000)) : maxTime;

    if (!data.localTime) {
      return;
    }

    this.chart
      .width(this.props.width)
      .height(this.props.height)
      .title(data.labels ? data.labels.title : 'Loading...')
      .animationDelay(data.paused ? null : 1000)
      .singlePointTime(1000)

      .xDomain([minTime, maxTime])
      .xVal((d, i) => data.localTime[i])
      .xValues((selectionData) => selectionData.localTime)

      .yDomain(data.yDomain || [0, 0])
      .yVal((d) => d)
      .yValues((selectionData) => selectionData.dataSets)
      .yUnits(data.labels ? data.labels.yAxis : '')
      .yData((yValue) => yValue.count)
      .yLabel((yValue) => yValue.line)
      .yFormat(d3.format('s'))

      .y2Domain(data.secondScale ? [0, data.secondScale.currentMax] : null)
      .y2Val((d) => d)
      .y2Values((selectionData) => selectionData.secondScale ? [selectionData.secondScale] : [])
      .y2Units(data.secondScale ? data.secondScale.units : '')
      .y2Data((y2Value) => y2Value.count)
      .y2Label((y2Value) => y2Value.line)
      .y2Format(d3.format('s'))

      .defined((d, i) => !data.skip[i])
      .color(d3.scale.ordinal().range(LINE_COLORS))
      .strokeWidth(2)
      .on('mouseover', Actions.mouseOver)
      .on('mouseout', Actions.mouseOut)
      .eventDispatcher(this.props.dispatcher);

    d3.select(el)
      .datum(this.state.data)
      .call(this.chart);
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="chart">
        <div ref="container"></div>
      </div>
    );
  }

}

ChartComponent.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  store: React.PropTypes.any.isRequired,
  dispatcher: React.PropTypes.any.isRequired
};

ChartComponent.displayName = 'ChartComponent';

module.exports = ChartComponent;
